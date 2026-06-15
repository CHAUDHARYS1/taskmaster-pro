import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDocuments(workspaceId) {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchDocs = useCallback(async () => {
    let query = supabase
      .from('documents')
      .select('id, title, workspace_id, created_by, created_at, updated_at, preview, pinned')
      .order('updated_at', { ascending: false })
    if (workspaceId) query = query.eq('workspace_id', workspaceId)
    const { data, error } = await query
    if (error) setError(error.message)
    else setDocs(data ?? [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    fetchDocs()
  }, [workspaceId, fetchDocs])

  const createDoc = async (wsId) => {
    const { data, error } = await supabase
      .from('documents')
      .insert({ workspace_id: wsId ?? workspaceId, title: 'Untitled', pinned: false })
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
