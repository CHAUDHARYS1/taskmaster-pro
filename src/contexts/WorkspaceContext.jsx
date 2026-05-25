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
      setCurrentWorkspace(prev => {
        if (prev) return prev  // already set (e.g. after invite accept)
        // Restore last-used workspace, fall back to personal then first
        const lastId = localStorage.getItem('tm_last_workspace')
        return (lastId && data.find(w => w.id === lastId))
          ?? data.find(w => w.id === user.id)
          ?? data[0]
          ?? null
      })
    }
    setLoading(false)
  }, [user])

  useEffect(() => { fetchWorkspaces() }, [fetchWorkspaces])

  // Keep localStorage in sync whenever currentWorkspace changes
  useEffect(() => {
    if (currentWorkspace?.id) localStorage.setItem('tm_last_workspace', currentWorkspace.id)
  }, [currentWorkspace])

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

  const switchWorkspace = useCallback((workspace) => {
    if (workspace?.id) localStorage.setItem('tm_last_workspace', workspace.id)
    setCurrentWorkspace(workspace)
  }, [])

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
    if (localStorage.getItem('tm_last_workspace') === id) {
      localStorage.removeItem('tm_last_workspace')
    }
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== id)
      const fallback = next.find(w => w.id === user?.id) ?? next[0] ?? null
      if (fallback?.id) localStorage.setItem('tm_last_workspace', fallback.id)
      setCurrentWorkspace(fallback)
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
