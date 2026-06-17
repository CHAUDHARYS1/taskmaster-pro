import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { List, CalendarBlank } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import Sidebar from '../layout/Sidebar'
import CalendarView from './CalendarView'
import PageHint from '../ui/PageHint'
import { BellButton } from '../notifications/NotificationCenter'

const TaskDetailPanel = lazy(() => import('../board/TaskDetailPanel'))
const SettingsModal   = lazy(() => import('../ui/SettingsModal'))

export default function CalendarPage() {
  const { workspaces, currentWorkspace, loading: wsLoading } = useWorkspace()
  const { user } = useAuth()
  const { toast } = useToast()

  const [showSidebar,      setShowSidebar]      = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [showSettings, setShowSettings] = useState(false)
  const [filterWsId,   setFilterWsId]   = useState('all')
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)
  const [allProjects,  setAllProjects]  = useState([])

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  // Load all projects once workspaces are ready
  useEffect(() => {
    if (wsLoading || workspaces.length === 0) return
    const wsIds = workspaces.map(w => w.id)
    supabase
      .from('projects')
      .select('id, name, workspace_id, color, position')
      .in('workspace_id', wsIds)
      .order('position')
      .then(({ data }) => setAllProjects(data ?? []))
  }, [workspaces, wsLoading])

  // Flat list of project options for the quick-add form
  const projectOptions = useMemo(() =>
    workspaces.flatMap(ws =>
      allProjects
        .filter(p => p.workspace_id === ws.id)
        .map(p => ({
          value: `${ws.id}|${p.id}`,
          label: workspaces.length > 1 ? `${ws.name} / ${p.name}` : p.name,
        }))
    ), [workspaces, allProjects])

  // Load tasks that have a due date
  useEffect(() => {
    if (wsLoading || workspaces.length === 0) return
    setLoading(true)

    const wsIds = filterWsId === 'all'
      ? workspaces.map(w => w.id)
      : [filterWsId]

    let q = supabase
      .from('tasks')
      .select('*, assignee:profiles!assignee_id(email), project:projects(id,name,color), task_checklist_items(id,checked)')
      .not('due_date', 'is', null)

    q = wsIds.length === 1
      ? q.eq('workspace_id', wsIds[0])
      : q.in('workspace_id', wsIds)

    q.order('due_date', { ascending: true })
      .then(({ data }) => { setTasks(data ?? []); setLoading(false) })
  }, [workspaces, filterWsId, wsLoading])

  const handleUpdateTask = async (taskId, updates) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t))
    setSelectedTask(prev => prev?.id === taskId ? { ...prev, ...updates } : prev)
    const { error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) toast.error(error.message || 'Failed to update task')
  }

  const handleDeleteTask = async (taskId) => {
    const deleted = tasks.find(t => t.id === taskId)
    setTasks(prev => prev.filter(t => t.id !== taskId))
    if (selectedTask?.id === taskId) setSelectedTask(null)
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      toast.error(error.message || 'Failed to delete task')
      if (deleted) setTasks(prev => [...prev, deleted])
    } else {
      toast.success('Task deleted')
    }
  }

  const handleReschedule = async (taskId, newDate) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: newDate } : t))
    const { error } = await supabase
      .from('tasks')
      .update({ due_date: newDate, updated_at: new Date().toISOString() })
      .eq('id', taskId)
    if (error) {
      toast.error(error.message || 'Failed to reschedule task')
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, due_date: t.due_date } : t))
    } else {
      toast.success('Task rescheduled')
    }
  }

  const handleQuickAdd = async (date, text, wsId, projectId) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          workspace_id: wsId,
          project_id:   projectId,
          created_by:   user.id,
          text,
          due_date:     date,
          status:       'toDo',
          position:     (tasks.length + 1) * 1000,
        })
        .select('*, assignee:profiles!assignee_id(email), project:projects(id,name,color), task_checklist_items(id,checked)')
        .single()
      if (error) throw error
      setTasks(prev => [...prev, data])
      toast.success('Task added')
    } catch (err) {
      toast.error(err.message || 'Failed to add task')
    }
  }

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} onProfileClick={() => setShowSettings(true)} />

      <main className="board-main board-main--cal">
        <div className="mobile-appbar">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(prev => !prev)} aria-label="Toggle sidebar">
            <List size={22} aria-hidden="true" />
          </button>
          <div className="mobile-appbar-title">
            <div className="mobile-appbar-text">
              <div className="mobile-appbar-sub">Calendar</div>
              <div className="mobile-appbar-ws"><span>All workspaces</span></div>
            </div>
          </div>
          <BellButton />
        </div>
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <CalendarBlank size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Calendar</span>
          </div>

          <div className="board-header-right">
            {workspaces.length > 1 && (
              <select
                className="field-select cal-ws-filter"
                value={filterWsId}
                onChange={e => setFilterWsId(e.target.value)}
                aria-label="Filter by workspace"
              >
                <option value="all">All workspaces</option>
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
            <PageHint text="View all tasks that have a due date. Click + on any day to add a task, or click a task to open it." />
          </div>
        </div>

        <div className="cal-page-body">
          {loading ? (
            <div className="cal-loading">Loading…</div>
          ) : (
            <CalendarView
              tasks={tasks}
              onTaskClick={t => setSelectedTask(t)}
              onQuickAdd={handleQuickAdd}
              onReschedule={handleReschedule}
              onDeleteTask={handleDeleteTask}
              projectOptions={projectOptions}
            />
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            canEdit
            onUpdate={handleUpdateTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </Suspense>
    </div>
  )
}
