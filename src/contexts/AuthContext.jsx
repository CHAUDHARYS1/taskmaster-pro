import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

const DEFAULT_PREFS = {
  defaultView:     'board',
  cardDensity:     'comfortable',
  dateFormat:      'relative',
  weekStart:       1,
  inAppReminders:  true,
  emailReminders:  true,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch profile whenever user changes
  useEffect(() => {
    if (!user) { setProfile(null); return }
    supabase
      .from('profiles')
      .select('first_name, last_name, email, avatar_url, preferences')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null))
  }, [user])

  const signUp = (email, password, firstName, lastName) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { first_name: firstName, last_name: lastName } },
    }).then(async (res) => {
      // If sign-up succeeded and we have a session, also write names to profiles
      // (the trigger handles it for new rows, but the user may already exist)
      if (!res.error && res.data?.user) {
        const uid = res.data.user.id
        await supabase
          .from('profiles')
          .update({ first_name: firstName, last_name: lastName })
          .eq('id', uid)
      }
      return res
    })

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => supabase.auth.signOut()

  const updateProfile = async ({ first_name, last_name }) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ first_name, last_name })
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => prev ? { ...prev, first_name, last_name } : null)
  }

  const updatePrefs = async (patch) => {
    if (!user) return
    const merged = { ...(profile?.preferences ?? {}), ...patch }
    const { error } = await supabase
      .from('profiles')
      .update({ preferences: merged })
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => prev ? { ...prev, preferences: merged } : null)
  }

  const uploadAvatar = async (file) => {
    if (!user) return
    const ext  = file.name.split('.').pop().toLowerCase() || 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    // Append cache-busting param so re-uploads are always fresh
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
    if (error) throw error
    setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null)
    return avatarUrl
  }

  // Returns "First Last", falls back to the email username
  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email?.split('@')[0]
    : user?.email?.split('@')[0] ?? ''

  const prefs = useMemo(
    () => ({ ...DEFAULT_PREFS, ...(profile?.preferences ?? {}) }),
    [profile?.preferences]
  )

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, updateProfile, uploadAvatar, displayName, prefs, updatePrefs }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
