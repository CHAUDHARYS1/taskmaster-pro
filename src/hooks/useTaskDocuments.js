import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useTaskDocuments(taskId) {
  const [linkedDocs, setLinkedDocs] = useState([])
  const [loading,    setLoading]    = useState(false)

  const fetch = useCallback(async () => {
    if (!taskId) { setLinkedDocs([]); return }
    setLoading(true)
    const { data, error } = await supabase
      .from('task_documents')
      .select('document_id, documents(id, title, updated_at)')
      .eq('task_id', taskId)
      .order('linked_at', { ascending: true })
    if (!error && data) {
      setLinkedDocs(data.map(r => r.documents).filter(Boolean))
    }
    setLoading(false)
  }, [taskId])

  useEffect(() => { fetch() }, [fetch])

  const addDoc = useCallback(async (docId) => {
    setLinkedDocs(prev => prev.some(d => d.id === docId) ? prev : [...prev, { id: docId, title: '…' }])
    const { error } = await supabase
      .from('task_documents')
      .insert({ task_id: taskId, document_id: docId })
    if (error) fetch()
    else fetch()
  }, [taskId, fetch])

  const removeDoc = useCallback(async (docId) => {
    setLinkedDocs(prev => prev.filter(d => d.id !== docId))
    const { error } = await supabase
      .from('task_documents')
      .delete()
      .eq('task_id', taskId)
      .eq('document_id', docId)
    if (error) fetch()
  }, [taskId, fetch])

  return { linkedDocs, loading, addDoc, removeDoc }
}
