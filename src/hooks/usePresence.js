import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePresence(workspaceId) {
  const { user, profile } = useAuth()
  const [present, setPresent] = useState([])

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email?.split('@')[0]
    : user?.email?.split('@')[0] ?? ''

  useEffect(() => {
    if (!workspaceId || !user) return

    const channel = supabase.channel(`presence:workspace:${workspaceId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).map(entries => entries[0])
        setPresent(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, email: user.email, display_name: displayName })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, user, displayName])

  return present
}
