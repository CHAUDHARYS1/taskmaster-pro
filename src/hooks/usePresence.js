import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePresence(workspaceId, editingTaskId = null) {
  const { user, profile } = useAuth()
  const [present, setPresent] = useState([])
  const channelRef = useRef(null)

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email?.split('@')[0]
    : user?.email?.split('@')[0] ?? ''

  useEffect(() => {
    if (!workspaceId || !user) return

    const channel = supabase.channel(`presence:workspace:${workspaceId}`, {
      config: { presence: { key: user.id } },
    })

    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).map(entries => entries[0])
        setPresent(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            email: user.email,
            display_name: displayName,
            editing_task_id: editingTaskId,
          })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-track when editingTaskId or displayName changes (without re-subscribing)
  useEffect(() => {
    if (!channelRef.current || !user) return
    channelRef.current.track({
      user_id: user.id,
      email: user.email,
      display_name: displayName,
      editing_task_id: editingTaskId,
    }).catch(() => {})
  }, [editingTaskId, displayName, user])

  return present
}
