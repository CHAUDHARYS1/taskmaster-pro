import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)

const DEFAULT_LABEL_MAP = { toDo: 'To Do', inProgress: 'In Progress', inReview: 'In Review', done: 'Done' }
const DEFAULT_COLUMN_COLORS = { toDo: '#6366f1', inProgress: '#0ea5e9', inReview: '#d97706', done: '#22c55e' }
export const ALL_COLUMN_IDS = ['toDo', 'inProgress', 'inReview', 'done']

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

  const createWorkspace = async (name, template = null) => {
    const { data, error } = await supabase.rpc('create_workspace', { workspace_name: name })
    if (error) throw error

    if (template && template.id !== 'blank') {
      const labels = {
        ...template.columnLabels,
        _template: template.id,
        ...(template.columnColors ? { _column_colors: template.columnColors } : {}),
        ...(template.columns    ? { _columns: template.columns }            : {}),
      }
      await supabase.from('workspaces').update({ column_labels: labels }).eq('id', data.id)
      data.column_labels = labels

      if (template.defaultLabels.length > 0) {
        await supabase.from('workspace_labels').insert(
          template.defaultLabels.map(l => ({ workspace_id: data.id, name: l.name, color: l.color }))
        )
      }
    }

    // Every new workspace gets a General project by default
    await supabase.from('projects').insert({
      workspace_id: data.id,
      name: 'General',
      color: '#2563EB',
      position: 0,
    })

    setWorkspaces(prev => [...prev, data])
    setCurrentWorkspace(data)
    return data
  }

  const columnLabels = useMemo(() => ({
    ...DEFAULT_LABEL_MAP,
    ...(currentWorkspace?.column_labels ?? {}),
  }), [currentWorkspace?.column_labels])

  const workspaceTemplate = currentWorkspace?.column_labels?._template ?? 'blank'

  const workspaceColumns = useMemo(() => {
    const rawLabels = currentWorkspace?.column_labels ?? {}
    const visibleIds = rawLabels._columns ?? ALL_COLUMN_IDS
    const colors = rawLabels._column_colors ?? {}
    return visibleIds
      .filter(id => !id.startsWith('_'))
      .map(id => ({
        id,
        label: rawLabels[id] ?? DEFAULT_LABEL_MAP[id] ?? id,
        color: colors[id] ?? DEFAULT_COLUMN_COLORS[id] ?? '#6366f1',
      }))
  }, [currentWorkspace?.column_labels])

  const updateColumnLabels = async (id, labels) => {
    const { error } = await supabase.from('workspaces').update({ column_labels: labels }).eq('id', id)
    if (error) throw error
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, column_labels: labels } : w))
    setCurrentWorkspace(prev => prev?.id === id ? { ...prev, column_labels: labels } : prev)
  }

  const renameWorkspace = async (id, name) => {
    const { error } = await supabase.from('workspaces').update({ name }).eq('id', id)
    if (error) throw error
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w))
    setCurrentWorkspace(prev => prev?.id === id ? { ...prev, name } : prev)
  }

  const updateWorkspaceSettings = async (id, settings) => {
    const { error } = await supabase.from('workspaces').update(settings).eq('id', id)
    if (error) throw error
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...settings } : w))
    setCurrentWorkspace(prev => prev?.id === id ? { ...prev, ...settings } : prev)
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
      autoArchiveDays: currentWorkspace?.auto_archive_after_days ?? null,
      columnLabels, workspaceTemplate, workspaceColumns,
      switchWorkspace, createWorkspace, renameWorkspace, deleteWorkspace,
      updateWorkspaceSettings, updateColumnLabels,
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
