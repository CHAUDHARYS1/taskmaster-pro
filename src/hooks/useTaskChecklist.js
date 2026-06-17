import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTaskChecklist(taskId) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  const fetchItems = useCallback(async () => {
    if (!taskId) return
    const { data, error } = await supabase
      .from('task_checklist_items')
      .select('*')
      .eq('task_id', taskId)
      .order('position', { ascending: true })
    if (error) {
      console.error('[useTaskChecklist] fetch failed:', error.message)
      setFetchError(error.message)
    } else {
      setFetchError(null)
      if (data) setItems(data)
    }
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    fetchItems()

    const channel = supabase
      .channel(`checklist:${taskId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'task_checklist_items',
        filter: `task_id=eq.${taskId}`,
      }, ({ new: row }) => {
        setItems(prev => prev.some(i => i.id === row.id) ? prev : [...prev, row].sort((a, b) => a.position - b.position))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'task_checklist_items',
        filter: `task_id=eq.${taskId}`,
      }, ({ new: row }) => {
        setItems(prev => prev.map(i => i.id === row.id ? { ...i, ...row } : i))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'task_checklist_items',
        filter: `task_id=eq.${taskId}`,
      }, ({ old }) => {
        setItems(prev => prev.filter(i => i.id !== old.id))
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [taskId, fetchItems])

  const addItem = async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const maxPos = items.length ? Math.max(...items.map(i => i.position)) : 0
    const pos    = maxPos + 1000
    const tempId = `opt-${Date.now()}`

    // Show immediately; swap with the real row once DB confirms
    setItems(prev => [...prev, { id: tempId, task_id: taskId, text: trimmed, checked: false, position: pos }])

    const { data, error } = await supabase.from('task_checklist_items').insert({
      task_id:    taskId,
      text:       trimmed,
      checked:    false,
      position:   pos,
      created_by: user.id,
    }).select().single()

    if (error) {
      setItems(prev => prev.filter(i => i.id !== tempId))
      throw error
    }

    if (data) {
      setItems(prev => {
        const withoutTemp = prev.filter(i => i.id !== tempId)
        // realtime may have already added the real row — avoid duplicate
        return withoutTemp.some(i => i.id === data.id) ? withoutTemp : [...withoutTemp, data]
      })
    }

    return data
  }

  const updateItem = async (id, patches) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patches } : i))
    const { error } = await supabase
      .from('task_checklist_items')
      .update(patches)
      .eq('id', id)
    if (error) { fetchItems(); throw error }
  }

  const deleteItem = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
    if (error) { fetchItems(); throw error }
  }

  return { items, loading, fetchError, addItem, updateItem, deleteItem }
}
