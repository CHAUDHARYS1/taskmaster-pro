import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function usePresence(workspaceId) {
  const { user } = useAuth()
  const [present, setPresent] = useState([])

  useEffect(() => {
    if (!workspaceId || !user) return

    // Key by user.id so multiple tabs from the same user merge into one entry
    const channel = supabase.channel(`presence:workspace:${workspaceId}`, {
      config: { presence: { key: user.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Each key maps to an array of presence payloads; take the first per user
        const users = Object.values(state).map(entries => entries[0])
        setPresent(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, email: user.email })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [workspaceId, user])

  return present
}
