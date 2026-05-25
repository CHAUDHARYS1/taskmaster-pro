import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProjects(workspaceId) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!workspaceId) { setLoading(false); return }
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
    if (data) setProjects(data)
    setLoading(false)
  }, [workspaceId])

  useEffect(() => {
    if (!workspaceId) return
    fetch()

    const channel = supabase
      .channel(`projects:${workspaceId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'projects',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ new: p }) => setProjects(prev => [...prev, p].sort((a, b) => a.position - b.position)))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'projects',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ new: p }) => setProjects(prev => prev.map(x => x.id === p.id ? p : x)))
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'projects',
        filter: `workspace_id=eq.${workspaceId}`,
      }, ({ old: p }) => setProjects(prev => prev.filter(x => x.id !== p.id)))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [workspaceId, fetch])

  const addProject = async ({ name, color = '#2563EB' }) => {
    const maxPos = projects.length ? Math.max(...projects.map(p => p.position)) : 0
    const { data, error } = await supabase
      .from('projects')
      .insert({ workspace_id: workspaceId, name: name.trim(), color, position: maxPos + 1000 })
      .select()
      .single()
    if (error) throw error
    return data
  }

  const renameProject = async (id, name) => {
    const { error } = await supabase.from('projects').update({ name: name.trim() }).eq('id', id)
    if (error) throw error
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() } : p))
  }

  const deleteProject = async (id) => {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  return { projects, loading, addProject, renameProject, deleteProject, refetch: fetch }
}
