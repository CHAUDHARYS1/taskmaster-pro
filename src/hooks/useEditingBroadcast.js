import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

/**
 * Tracks which task each user has open for editing using Supabase Broadcast.
 * Broadcast fires instantly on all connected clients — no heartbeat delay.
 *
 * Returns editingMap: { [taskId]: { user_id, display_name, email } }
 * Excludes the current user's own entry so cards don't glow for themselves.
 *
 * @param {string|null} workspaceId
 * @param {string|null} editingTaskId  - the task ID the current user has open
 */
export function useEditingBroadcast(workspaceId, editingTaskId) {
  const { user, profile, displayName } = useAuth()
  const [editingMap, setEditingMap] = useState({})
  const channelRef = useRef(null)

  // Remove a user's entry from the map by user_id
  const clearUser = (userId) => {
    setEditingMap(prev => {
      const next = { ...prev }
      for (const taskId of Object.keys(next)) {
        if (next[taskId]?.user_id === userId) delete next[taskId]
      }
      return next
    })
  }

  useEffect(() => {
    if (!workspaceId || !user) return

    // Separate channel just for editing broadcasts so it doesn't interfere with presence
    const channel = supabase.channel(`editing:workspace:${workspaceId}`)
    channelRef.current = channel

    channel
      // Another user started or stopped editing a task
      .on('broadcast', { event: 'editing' }, ({ payload }) => {
        if (payload.user_id === user.id) return // ignore own echoes
        setEditingMap(prev => {
          const next = { ...prev }
          // Clear any previous task this user was editing
          for (const taskId of Object.keys(next)) {
            if (next[taskId]?.user_id === payload.user_id) delete next[taskId]
          }
          // Register new task (null task_id = stopped editing)
          if (payload.task_id) next[payload.task_id] = payload
          return next
        })
      })
      // Another user left presence entirely (tab closed, network drop)
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences) {
          if (p.user_id) clearUser(p.user_id)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [workspaceId, user])

  // Broadcast whenever the current user's editing task changes
  useEffect(() => {
    const channel = channelRef.current
    if (!channel || !user) return

    channel.send({
      type: 'broadcast',
      event: 'editing',
      payload: {
        user_id: user.id,
        display_name: displayName,
        email: user.email,
        task_id: editingTaskId ?? null,
      },
    })
  }, [editingTaskId, user, displayName])

  return editingMap
}
