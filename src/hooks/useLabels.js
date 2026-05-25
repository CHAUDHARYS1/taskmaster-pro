import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useLabels(workspaceId) {
  const [labels, setLabels] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!workspaceId) { setLabels([]); setLoading(false); return }
    const { data } = await supabase
      .from('workspace_labels')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })
    setLabels(data ?? [])
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    setLoading(true)
    fetch()

    if (!workspaceId) return
    const channel = supabase
      .channel(`labels:${workspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'workspace_labels',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ new: row }) => {
        setLabels(prev => prev.some(l => l.id === row.id) ? prev : [...prev, row])
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'workspace_labels',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ old }) => {
        setLabels(prev => prev.filter(l => l.id !== old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, fetch])

  const addLabel = async ({ name, color }) => {
    const { data, error } = await supabase
      .from('workspace_labels')
      .insert({ workspace_id: workspaceId, name: name.trim(), color })
      .select()
      .single()
    if (error) throw error
    setLabels(prev => prev.some(l => l.id === data.id) ? prev : [...prev, data])
  }

  const deleteLabel = async (id) => {
    setLabels(prev => prev.filter(l => l.id !== id))
    await supabase.from('workspace_labels').delete().eq('id', id)
  }

  return { labels, loading, addLabel, deleteLabel }
}
