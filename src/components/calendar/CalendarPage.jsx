import { lazy, Suspense, useEffect, useState } from 'react'
import { List, CalendarBlank } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import Sidebar from '../layout/Sidebar'
import CalendarView from './CalendarView'

const TaskDetailPanel = lazy(() => import('../board/TaskDetailPanel'))

export default function CalendarPage() {
  const { workspaces, loading: wsLoading } = useWorkspace()
  const { toast } = useToast()

  const [showSidebar,  setShowSidebar]  = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }
  const [filterWsId,   setFilterWsId]   = useState('all')
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedTask, setSelectedTask] = useState(null)

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

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <main className="board-main">
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

          {workspaces.length > 1 && (
            <div className="board-header-right">
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
            </div>
          )}
        </div>

        <div className="cal-page-body">
          {loading ? (
            <div className="cal-loading">Loading…</div>
          ) : (
            <CalendarView tasks={tasks} onTaskClick={t => setSelectedTask(t)} />
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        {selectedTask && (
          <TaskDetailPanel
            task={selectedTask}
            canEdit
            autoSave
            onUpdate={handleUpdateTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </Suspense>
    </div>
  )
}
