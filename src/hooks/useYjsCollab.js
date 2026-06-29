import * as Y from 'yjs'
import { useEffect, useId, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const SYNC_TIMEOUT_MS = 400

/**
 * Manages a Yjs document synced across all users editing the same doc
 * via Supabase Broadcast as the transport. No Yjs server required.
 *
 * Protocol:
 *  1. On subscribe: send 'y-sync-request' to ask existing editors for state
 *  2. Existing editors respond with 'y-sync-state' (full Y.encodeStateAsUpdate)
 *  3. Incremental updates go out as 'y-update' on every local ydoc change
 *
 * initMode:
 *  'waiting'   – connecting, haven't received sync or timed out yet
 *  'from-html' – no other editors responded; caller should set content from HTML
 *  'from-yjs'  – received peer state; ydoc already has the latest content
 */
export function useYjsCollab(docId, userId) {
  const ydocRef = useRef(null)
  if (!ydocRef.current) ydocRef.current = new Y.Doc()

  const instanceId = useId().replace(/:/g, '')
  const [initMode, setInitMode] = useState('waiting')

  useEffect(() => {
    if (!docId || !userId) return
    const ydoc = ydocRef.current
    let syncReceived = false
    let mounted = true

    const channel = supabase
      .channel(`yjs-doc:${docId}`)
      // Incremental update from a peer
      .on('broadcast', { event: 'y-update' }, ({ payload }) => {
        if (!mounted || payload.from === instanceId) return
        const update = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0))
        Y.applyUpdate(ydoc, update, 'remote')
      })
      // A new peer is asking for our full state
      .on('broadcast', { event: 'y-sync-request' }, ({ payload }) => {
        if (!mounted || payload.from === instanceId) return
        const state = Y.encodeStateAsUpdate(ydoc)
        const encoded = btoa(String.fromCharCode(...state))
        channel.send({
          type: 'broadcast', event: 'y-sync-state',
          payload: { from: instanceId, to: payload.from, data: encoded },
        })
      })
      // A peer is responding to our sync request
      .on('broadcast', { event: 'y-sync-state' }, ({ payload }) => {
        if (!mounted || payload.to !== instanceId || syncReceived) return
        syncReceived = true
        const state = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0))
        Y.applyUpdate(ydoc, state, 'remote')
        setInitMode('from-yjs')
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED' || !mounted) return
        channel.send({
          type: 'broadcast', event: 'y-sync-request',
          payload: { from: instanceId },
        })
        setTimeout(() => {
          if (!mounted || syncReceived) return
          setInitMode('from-html')
        }, SYNC_TIMEOUT_MS)
      })

    // Broadcast every local (non-remote) ydoc update to peers
    const onUpdate = (update, origin) => {
      if (origin === 'remote' || !mounted) return
      const encoded = btoa(String.fromCharCode(...update))
      channel.send({
        type: 'broadcast', event: 'y-update',
        payload: { from: instanceId, data: encoded },
      })
    }
    ydoc.on('update', onUpdate)

    return () => {
      mounted = false
      ydoc.off('update', onUpdate)
      supabase.removeChannel(channel)
    }
  }, [docId, userId, instanceId])

  return { ydoc: ydocRef.current, initMode }
}
