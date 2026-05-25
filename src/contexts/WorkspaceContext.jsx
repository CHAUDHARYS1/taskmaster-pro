import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspaces, setWorkspaces]         = useState([])
  const [currentWorkspace, setCurrentWorkspace] = useState(null)
  const [userRole, setUserRole]             = useState(null)
  const [loading, setLoading]               = useState(true)

  const fetchWorkspaces = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: true })

    if (!error && data) {
      setWorkspaces(data)
      // Default to personal workspace (id === user.id) unless one is already selected
      setCurrentWorkspace(prev => prev ?? (data.find(w => w.id === user.id) ?? data[0] ?? null))
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchWorkspaces() }, [fetchWorkspaces])

  // Resolve the user's role in the active workspace
  useEffect(() => {
    if (!currentWorkspace || !user) return
    supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', currentWorkspace.id)
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => setUserRole(data?.role ?? 'member'))
  }, [currentWorkspace, user])

  const switchWorkspace = useCallback((workspace) => setCurrentWorkspace(workspace), [])

  const createWorkspace = async (name) => {
    const { data, error } = await supabase.rpc('create_workspace', { workspace_name: name })
    if (error) throw error
    setWorkspaces(prev => [...prev, data])
    setCurrentWorkspace(data)
    return data
  }

  const renameWorkspace = async (id, name) => {
    const { error } = await supabase.from('workspaces').update({ name }).eq('id', id)
    if (error) throw error
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w))
    setCurrentWorkspace(prev => prev?.id === id ? { ...prev, name } : prev)
  }

  const deleteWorkspace = async (id) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id)
    if (error) throw error
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== id)
      // Switch to personal workspace or first remaining
      setCurrentWorkspace(next.find(w => w.id === user?.id) ?? next[0] ?? null)
      return next
    })
  }

  return (
    <WorkspaceContext.Provider value={{
      workspaces, currentWorkspace, userRole, loading,
      switchWorkspace, createWorkspace, renameWorkspace, deleteWorkspace,
      refetch: fetchWorkspaces,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider')
  return ctx
}
