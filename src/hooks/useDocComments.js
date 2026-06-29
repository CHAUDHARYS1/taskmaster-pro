import { useCallback, useEffect, useId, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useDocComments(docId) {
  const [comments, setComments] = useState([])
  const instanceId = useId().replace(/:/g, '')

  const fetchAll = useCallback(async () => {
    if (!docId) return
    const { data } = await supabase
      .from('doc_comments')
      .select('*, comment_messages(*)')
      .eq('doc_id', docId)
      .eq('resolved', false)
      .order('created_at', { ascending: true })
    setComments(
      (data ?? []).map(c => ({
        ...c,
        comment_messages: (c.comment_messages ?? []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }))
    )
  }, [docId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Realtime: re-fetch on any comment change; append new messages locally
  useEffect(() => {
    if (!docId) return
    const channel = supabase
      .channel(`doc-comments:${docId}:${instanceId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'doc_comments',
        filter: `doc_id=eq.${docId}`,
      }, fetchAll)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'comment_messages',
      }, ({ new: msg }) => {
        setComments(prev => {
          const target = prev.find(c => c.id === msg.comment_id)
          if (!target) return prev // message for a comment not in view
          const alreadyHas = target.comment_messages.some(m => m.id === msg.id)
          if (alreadyHas) return prev
          return prev.map(c =>
            c.id === msg.comment_id
              ? { ...c, comment_messages: [...c.comment_messages, msg] }
              : c
          )
        })
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [docId, instanceId, fetchAll])

  const addComment = useCallback(async ({ quote, body, userId }) => {
    const { data: comment, error } = await supabase
      .from('doc_comments')
      .insert({ doc_id: docId, created_by: userId, quote })
      .select()
      .single()
    if (error) throw error
    const { data: msg, error: msgErr } = await supabase
      .from('comment_messages')
      .insert({ comment_id: comment.id, created_by: userId, body })
      .select()
      .single()
    if (msgErr) throw msgErr
    setComments(prev => [...prev, { ...comment, comment_messages: [msg] }])
    return comment
  }, [docId])

  const addReply = useCallback(async (commentId, body, userId) => {
    const { data: msg, error } = await supabase
      .from('comment_messages')
      .insert({ comment_id: commentId, created_by: userId, body })
      .select()
      .single()
    if (error) throw error
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, comment_messages: [...c.comment_messages, msg] }
        : c
    ))
    return msg
  }, [])

  const resolveComment = useCallback(async (commentId, userId) => {
    const { error } = await supabase
      .from('doc_comments')
      .update({ resolved: true, resolved_by: userId, resolved_at: new Date().toISOString() })
      .eq('id', commentId)
    if (error) throw error
    setComments(prev => prev.filter(c => c.id !== commentId))
  }, [])

  return { comments, addComment, addReply, resolveComment }
}
