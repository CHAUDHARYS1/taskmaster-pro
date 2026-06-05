import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUSES = ['toDo', 'inProgress', 'inReview', 'done']

export function useTasks(workspaceId, projectId) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return
    let query = supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(email), comments(count), project:projects(id,name,color), task_checklist_items(id,text,checked,position)')
      .eq('workspace_id', workspaceId)
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query.order('position', { ascending: true })
    if (error) setError(error.message)
    else setTasks(data)
    setLoading(false)
  }, [workspaceId, projectId])

  useEffect(() => {
    if (!workspaceId) { setTasks([]); setLoading(false); return }
    fetchTasks()

    const channelName = projectId ? `project:${projectId}` : `workspace:${workspaceId}`
    const filter      = projectId
      ? `project_id=eq.${projectId}`
      : `workspace_id=eq.${workspaceId}`

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'tasks', filter,
      }, () => fetchTasks())
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'tasks', filter,
      }, ({ new: task }) => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task } : t)))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'tasks', filter,
      }, ({ old: task }) => setTasks(prev => prev.filter(t => t.id !== task.id)))
      // Keep the embedded checklist array in sync so card indicators update live
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'task_checklist_items',
      }, ({ new: row }) => setTasks(prev => prev.map(t => {
        if (t.id !== row.task_id) return t
        const existing = t.task_checklist_items ?? []
        if (existing.some(i => i.id === row.id)) return t
        return { ...t, task_checklist_items: [...existing, { id: row.id, text: row.text, checked: row.checked, position: row.position }] }
      })))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'task_checklist_items',
      }, ({ new: row }) => setTasks(prev => prev.map(t => {
        if (t.id !== row.task_id) return t
        return { ...t, task_checklist_items: (t.task_checklist_items ?? []).map(i => i.id === row.id ? { ...i, checked: row.checked } : i) }
      })))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'task_checklist_items',
      }, ({ old: row }) => setTasks(prev => prev.map(t => {
        if (t.id !== row.task_id) return t
        return { ...t, task_checklist_items: (t.task_checklist_items ?? []).filter(i => i.id !== row.id) }
      })))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, projectId, fetchTasks])

  const addTask = async ({ text, description, due_date, due_time, status = 'toDo', priority = null, assignee_id = null, labels = [] }) => {
    const colTasks = tasks.filter(t => t.status === status)
    const minPos = colTasks.length ? Math.min(...colTasks.map(t => t.position)) : 0
    const { data, error } = await supabase.from('tasks').insert({
      workspace_id: workspaceId,
      project_id:   projectId,
      text,
      description:  description || null,
      due_date:     due_date || null,
      due_time:     due_time || null,
      status,
      position:     minPos - 1000,
      priority:     priority || null,
      assignee_id:  assignee_id || null,
      labels:       labels.length ? labels : [],
    }).select('*, assignee:profiles!assignee_id(email), comments(count), project:projects(id,name,color), task_checklist_items(id,text,checked,position)').single()
    if (error) throw error
    setTasks(prev => [...prev, data])
    return data.id
  }

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
    const { error } = await supabase.rpc('trash_task', { p_task_id: taskId })
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

  const patchTaskChecklist = useCallback((taskId, fn) => {
    setTasks(prev => prev.map(t =>
      t.id !== taskId ? t : { ...t, task_checklist_items: fn(t.task_checklist_items ?? []) }
    ))
  }, [])

  const tasksByStatus = useMemo(() => STATUSES.reduce((acc, status) => {
    acc[status] = tasks
      .filter(t => t.status === status)
      .sort((a, b) => a.position - b.position)
    return acc
  }, {}), [tasks])

  return { tasks, tasksByStatus, loading, error, addTask, reorderTask, deleteTask, updateTask, patchTaskChecklist }
}
