import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUSES = ['toDo', 'inProgress', 'inReview', 'done']

export function useTasks(workspaceId, projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!workspaceId || !projectId) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(email), comments(count)')
      .eq('workspace_id', workspaceId)
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }, [workspaceId, projectId])

  useEffect(() => {
    if (!workspaceId || !projectId) { setTasks([]); setLoading(false); return }
    fetchTasks()

    const channel = supabase
      .channel(`project:${projectId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, ({ new: task }) => setTasks(prev => [...prev, task]))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, ({ new: task }) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tasks',
        filter: `project_id=eq.${projectId}`,
      }, ({ old: task }) => setTasks(prev => prev.filter(t => t.id !== task.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, projectId, fetchTasks])

  const addTask = async ({ text, description, due_date, status = 'toDo' }) => {
    const colTasks = tasks.filter(t => t.status === status)
    const maxPos = colTasks.length ? Math.max(...colTasks.map(t => t.position)) : 0
    const { error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      project_id:   projectId,
      text,
      description:  description || null,
      due_date:     due_date || null,
      status,
      position:     maxPos + 1000,
    })
    if (error) throw error
  }

  // Optimistic reorder — updates status and position together
  const reorderTask = async (taskId, newStatus, newPosition) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
    ))
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) { fetchTasks(); throw error }
  }

  const deleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId))
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) { fetchTasks(); throw error }
  }

  const updateTask = async (taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) { fetchTasks(); throw error }
  }

  // Always sorted by position so real-time updates and optimistic moves stay ordered
  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {})

  return { tasks, tasksByStatus, loading, error, addTask, reorderTask, deleteTask, updateTask }
}
