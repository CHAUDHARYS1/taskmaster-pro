import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { userColor } from '../lib/userColor'

export function useDocCollaboration(docId, editor, user, displayName) {
  const [remoteUsers, setRemoteUsers] = useState([])
  const [remoteCursors, setRemoteCursors] = useState({})
  const channelRef  = useRef(null)
  const throttleRef = useRef(null)

  // One channel per document — presence + cursor broadcasts
  useEffect(() => {
    if (!docId || !user) return

    const color = userColor(user.id)
    const channel = supabase.channel(`doc-collab:${docId}`, {
      config: { presence: { key: user.id } },
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).map(entries => entries[0])
        setRemoteUsers(users.filter(u => u.user_id !== user.id))
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences) {
          if (p.user_id && p.user_id !== user.id) {
            setRemoteCursors(prev => {
              const next = { ...prev }
              delete next[p.user_id]
              return next
            })
          }
        }
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (!payload?.user_id || payload.user_id === user.id) return
        setRemoteCursors(prev => ({
          ...prev,
          [payload.user_id]: {
            user_id:      payload.user_id,
            display_name: payload.display_name ?? 'User',
            color:        userColor(payload.user_id),
            anchor:       payload.anchor,
            head:         payload.head,
          },
        }))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ user_id: user.id, display_name: displayName, color })
        }
      })

    return () => {
      clearTimeout(throttleRef.current)
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [docId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Broadcast cursor position whenever the editor selection or content changes
  useEffect(() => {
    if (!editor || !user) return

    const broadcastCursor = () => {
      clearTimeout(throttleRef.current)
      throttleRef.current = setTimeout(() => {
        const channel = channelRef.current
        if (!channel) return
        const { anchor, head } = editor.state.selection
        channel.send({
          type: 'broadcast',
          event: 'cursor',
          payload: { user_id: user.id, display_name: displayName, anchor, head },
        })
      }, 80)
    }

    editor.on('selectionUpdate', broadcastCursor)
    editor.on('update', broadcastCursor)

    return () => {
      editor.off('selectionUpdate', broadcastCursor)
      editor.off('update', broadcastCursor)
    }
  }, [editor, user?.id, displayName]) // eslint-disable-line react-hooks/exhaustive-deps

  return { remoteUsers, remoteCursors }
}
