import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useArchive(workspaceId) {
  const [archives, setArchives] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('archived_tasks')
      .select('*, assignee:profiles!assignee_id(email, first_name, last_name)')
      .eq('workspace_id', workspaceId)
      .order('archived_at', { ascending: false })
    if (data) setArchives(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => { fetch() }, [fetch])

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

  const archiveNow = async () => {
    const { data, error } = await supabase.rpc('archive_workspace_done', {
      p_workspace_id: workspaceId,
    })
    if (error) throw error
    await fetch()
    return data ?? 0
  }

  return { archives, loading, restoreTask, deleteArchive, archiveNow, refetch: fetch }
}
