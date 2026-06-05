import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useArchive(workspaceId) {
  const [archives, setArchives] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (workspaceId === undefined) { setLoading(false); return } // Board context: wait for workspace
    setLoading(true)
    let query = supabase
      .from('archived_tasks')
      .select('*, assignee:profiles!assignee_id(email, first_name, last_name), workspace:workspaces(id, name), project:projects(id, name, color)')
      .order('archived_at', { ascending: false })
    if (workspaceId) query = query.eq('workspace_id', workspaceId)
    const { data, error } = await query
    if (error) console.error('[useArchive] fetch failed:', error.message)
    if (data) setArchives(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    fetch()

    // Realtime: when any task is archived or un-archived, refresh the list
    const channelKey = workspaceId ? `archive-ws:${workspaceId}` : 'archive-all'
    const filter     = workspaceId ? { filter: `workspace_id=eq.${workspaceId}` } : {}

    const channel = supabase
      .channel(channelKey)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'archived_tasks', ...filter },
        () => fetch())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'archived_tasks', ...filter },
        ({ old: row }) => setArchives(prev => prev.filter(t => t.id !== row.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetch, workspaceId])

  const restoreTask = async (taskId) => {
    setArchives(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.rpc('restore_archived_task', { p_task_id: taskId })
    if (error) { fetch(); throw error }
  }

  const deleteArchive = async (taskId) => {
    setArchives(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.from('archived_tasks').delete().eq('id', taskId)
    if (error) { fetch(); throw error }
  }

  const archiveNow = async (projectId) => {
    const params = { p_workspace_id: workspaceId }
    if (projectId) params.p_project_id = projectId
    const { data, error } = await supabase.rpc('archive_workspace_done', params)
    if (error) throw error
    await fetch()
    return data ?? 0
  }

  return { archives, loading, restoreTask, deleteArchive, archiveNow, refetch: fetch }
}
