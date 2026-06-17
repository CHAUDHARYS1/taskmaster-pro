import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * @param {string | string[] | null} workspaceId
 *   - string   → single workspace (backward-compat, also subscribes to realtime)
 *   - string[] → multiple workspaces (WritesPage passes all workspace IDs)
 *   - null     → no filter, no realtime subscription
 * @param {{ onRemoteUpdate?: (doc: object) => void }} options
 */
export function useDocuments(workspaceId, { onRemoteUpdate } = {}) {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const onRemoteUpdateRef = useRef(onRemoteUpdate)
  useEffect(() => { onRemoteUpdateRef.current = onRemoteUpdate }, [onRemoteUpdate])

  // Normalise to a stable array or null
  const wsIds = Array.isArray(workspaceId)
    ? workspaceId
    : workspaceId ? [workspaceId] : null
  const wsKey = wsIds ? wsIds.join(',') : ''

  const fetchDocs = useCallback(async () => {
    let query = supabase
      .from('documents')
      .select('id, title, workspace_id, created_by, created_at, updated_at, preview, pinned')
      .order('updated_at', { ascending: false })
    if (wsIds?.length === 1) query = query.eq('workspace_id', wsIds[0])
    else if (wsIds?.length > 1) query = query.in('workspace_id', wsIds)
    const { data, error } = await query
    if (error) setError(error.message)
    else setDocs(data ?? [])
    setLoading(false)
  }, [wsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchDocs()
  }, [fetchDocs])

  // Real-time subscription — one Supabase channel per workspace
  useEffect(() => {
    if (!wsIds || wsIds.length === 0) return

    const channels = wsIds.map(id =>
      supabase
        .channel(`docs:ws:${id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'documents',
          filter: `workspace_id=eq.${id}`,
        }, ({ new: doc }) => {
          setDocs(prev => {
            if (prev.some(d => d.id === doc.id)) return prev
            return [doc, ...prev]
          })
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `workspace_id=eq.${id}`,
        }, ({ new: doc }) => {
          setDocs(prev => prev.map(d => d.id === doc.id ? { ...d, ...doc } : d))
          onRemoteUpdateRef.current?.(doc)
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'documents',
          filter: `workspace_id=eq.${id}`,
        }, ({ old: doc }) => {
          setDocs(prev => prev.filter(d => d.id !== doc.id))
        })
        .subscribe()
    )

    return () => { channels.forEach(c => supabase.removeChannel(c)) }
  }, [wsKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const createDoc = async (wsId) => {
    const { data, error } = await supabase
      .from('documents')
      .insert({ workspace_id: wsId, title: 'Untitled' })
      .select()
      .single()
    if (error) throw error
    setDocs(prev => [data, ...prev])
    return data
  }

  const pinDoc = async (id, pinned) => {
    const { error } = await supabase
      .from('documents')
      .update({ pinned })
      .eq('id', id)
    if (error) throw error
    setDocs(prev => prev.map(d => d.id === id ? { ...d, pinned } : d))
  }

  const updateDoc = async (id, updates) => {
    const { error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
    setDocs(prev => prev.map(d => d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d))
  }

  const deleteDoc = async (id) => {
    const { error } = await supabase.from('documents').delete().eq('id', id)
    if (error) throw error
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  const fetchDocContent = async (id) => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  }

  return { docs, loading, error, createDoc, updateDoc, deleteDoc, fetchDocContent, pinDoc }
}
