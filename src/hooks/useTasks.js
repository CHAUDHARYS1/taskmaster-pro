import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUSES = ['toDo', 'inProgress', 'inReview', 'done']

export function useTasks(workspaceId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return
    const { data, error } = await supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(email)')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })

    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    fetchTasks()

    const channel = supabase
      .channel(`workspace:${workspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ new: task }) => setTasks(prev => [...prev, task]))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ new: task }) => setTasks(prev => prev.map(t => t.id === task.id ? task : t)))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tasks',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ old: task }) => setTasks(prev => prev.filter(t => t.id !== task.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, fetchTasks])

  const addTask = async ({ text, due_date, status = 'toDo' }) => {
    const colTasks = tasks.filter(t => t.status === status)
    const maxPos = colTasks.length ? Math.max(...colTasks.map(t => t.position)) : 0
    const { error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      text,
      due_date: due_date || null,
      status,
      position: maxPos + 1000,
    })
    if (error) throw error
  }

  // Optimistic move — real-time will confirm for other clients
  const moveTask = async (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
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

  const tasksByStatus = STATUSES.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status)
    return acc
  }, {})

  return { tasks, tasksByStatus, loading, error, addTask, moveTask, deleteTask, updateTask }
}
