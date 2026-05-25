import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTaskDetail(taskId) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWithProfile = useCallback(async (id) => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(email, first_name, last_name)')
      .eq('id', id)
      .single()
    return data
  }, [])

  const fetchComments = useCallback(async () => {
    if (!taskId) return
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(email, first_name, last_name)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
    setLoading(false)
  }, [taskId])

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    fetchComments()

    const channel = supabase
      .channel(`comments:${taskId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, async ({ new: row }) => {
        const full = await fetchWithProfile(row.id)
        if (full) setComments(prev =>
          prev.some(c => c.id === full.id) ? prev : [...prev, full]
        )
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, ({ new: row }) => {
        setComments(prev => prev.map(c => c.id === row.id ? { ...c, body: row.body, updated_at: row.updated_at } : c))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'comments',
        filter: `task_id=eq.${taskId}`,
      }, ({ old }) => setComments(prev => prev.filter(c => c.id !== old.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [taskId, fetchComments, fetchWithProfile])

  const addComment = async (body) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ task_id: taskId, user_id: user.id, body })
      .select('*, profiles(email, first_name, last_name)')
      .single()
    if (error) throw error
    if (data) setComments(prev => prev.some(c => c.id === data.id) ? prev : [...prev, data])
  }

  const deleteComment = async (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId))
    await supabase.from('comments').delete().eq('id', commentId)
  }

  const updateComment = async (commentId, body) => {
    const { error } = await supabase
      .from('comments')
      .update({ body })
      .eq('id', commentId)
    if (error) throw error
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, body } : c))
  }

  return { comments, loading, addComment, deleteComment, updateComment }
}
