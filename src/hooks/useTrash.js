import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTrash(workspaceId) {
  const [trashed, setTrashed] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!workspaceId) return
    const { data } = await supabase
      .from('trashed_tasks')
      .select('*, assignee:profiles!assignee_id(email, first_name, last_name), project:projects(id,name,color)')
      .eq('workspace_id', workspaceId)
      .order('deleted_at', { ascending: false })
    if (data) setTrashed(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) { setTrashed([]); setLoading(false); return }
    fetch()

    const channel = supabase
      .channel(`trash:${workspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'trashed_tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, () => fetch())
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'trashed_tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ old: task }) => setTrashed(prev => prev.filter(t => t.id !== task.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, fetch])

  const restoreTask = async (taskId) => {
    setTrashed(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.rpc('restore_trashed_task', { p_task_id: taskId })
    if (error) { fetch(); throw error }
  }

  const permanentlyDelete = async (taskId) => {
    setTrashed(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.from('trashed_tasks').delete().eq('id', taskId)
    if (error) { fetch(); throw error }
  }

  return { trashed, loading, restoreTask, permanentlyDelete, refetch: fetch }
}
