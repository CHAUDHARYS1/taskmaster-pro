import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePresence(workspaceId) {
  const { user, profile } = useAuth()
  const [present, setPresent] = useState([])
  const channelRef = useRef(null)

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email?.split('@')[0]
    : user?.email?.split('@')[0] ?? ''

  const retrack = () => {
    const ch = channelRef.current
    if (!ch || !user) return
    ch.track({
      user_id:      user.id,
      email:        user.email,
      display_name: displayName,
      last_seen:    new Date().toISOString(),
    })
  }

  useEffect(() => {
    if (!workspaceId || !user) return

    const channel = supabase.channel(`presence:workspace:${workspaceId}`, {
      config: { presence: { key: user.id } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setPresent(Object.values(state).map(entries => entries[0]))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') retrack()
      })

    // Refresh last_seen every 60s so timestamps stay reasonably current
    const heartbeat = setInterval(retrack, 60_000)

    // Update last_seen on user activity, throttled to once per 30s
    let activityTimer = null
    const onActivity = () => {
      if (activityTimer) return
      activityTimer = setTimeout(() => {
        retrack()
        activityTimer = null
      }, 30_000)
    }
    window.addEventListener('mousemove', onActivity, { passive: true })
    window.addEventListener('keydown',   onActivity, { passive: true })

    return () => {
      clearInterval(heartbeat)
      clearTimeout(activityTimer)
      window.removeEventListener('mousemove', onActivity)
      window.removeEventListener('keydown',   onActivity)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workspaceId, user, displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  return present
}
