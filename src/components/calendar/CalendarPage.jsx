import { lazy, Suspense, useEffect, useState } from 'react'
import { List, CalendarBlank } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import Sidebar from '../layout/Sidebar'
import UtilityBar from '../layout/UtilityBar'
import CalendarView from './CalendarView'

const TaskDetailPanel = lazy(() => import('../board/TaskDetailPanel'))
const AddTaskPanel    = lazy(() => import('../board/AddTaskPanel'))

export default function CalendarPage() {
  const { workspaces, currentWorkspace, loading: wsLoading } = useWorkspace()
  const { user } = useAuth()
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
  const [showAddPanel,    setShowAddPanel]    = useState(false)
  const [addPanelDate,    setAddPanelDate]    = useState('')
  // value format: "wsId|projectId" — lets us derive both from one select
  const [createSelection, setCreateSelection] = useState('')
  const [allProjects,     setAllProjects]     = useState([])

  // Load projects for all workspaces in one query (no realtime subscription needed here)
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

  const [createWsId, createProjectId] = createSelection
    ? createSelection.split('|')
    : ['', '']

  // Group projects by workspace for optgroups
  const projectGroups = workspaces
    .map(ws => ({ ws, projects: allProjects.filter(p => p.workspace_id === ws.id) }))
    .filter(g => g.projects.length > 0)

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

  const handleAddTask = (date) => {
    if (!createWsId || !createProjectId) {
      toast.error('Choose a workspace and project before adding a task')
      return
    }
    setAddPanelDate(date)
    setShowAddPanel(true)
  }

  const handleSaveTask = async ({ text, description, due_date, due_time, status, priority, assignee_id, labels }) => {
    if (!createWsId || !createProjectId) throw new Error('Workspace and project are required')
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        workspace_id: createWsId,
        project_id:   createProjectId,
        created_by:   user.id,
        text,
        description:  description || null,
        due_date:     due_date    || null,
        due_time:     due_time    || null,
        status:       status      || 'toDo',
        priority:     priority    || null,
        assignee_id:  assignee_id || null,
        labels:       labels      || [],
        position:     (tasks.length + 1) * 1000,
      })
      .select('*, assignee:profiles!assignee_id(email), project:projects(id,name,color), task_checklist_items(id,checked)')
      .single()
    if (error) throw error
    if (data.due_date) setTasks(prev => [...prev, data])
    toast.success('Task created')
    return data.id
  }

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <main className="board-main">
        <UtilityBar />
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
            <div className={`cal-create-in${!createSelection ? ' cal-create-in--empty' : ''}`}>
              <span className="cal-create-in__label">Add tasks to</span>
              <select
                className="cal-create-select"
                value={createSelection}
                onChange={e => setCreateSelection(e.target.value)}
                aria-label="Workspace and project for new tasks"
              >
                <option value="">— choose project —</option>
                {projectGroups.map(({ ws, projects: wsPros }) => (
                  <optgroup key={ws.id} label={ws.name}>
                    {wsPros.map(p => (
                      <option key={p.id} value={`${ws.id}|${p.id}`}>{p.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="cal-page-body">
          {loading ? (
            <div className="cal-loading">Loading…</div>
          ) : (
            <CalendarView tasks={tasks} onTaskClick={t => setSelectedTask(t)} onAddTask={handleAddTask} />
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
        {showAddPanel && (
          <AddTaskPanel
            initialDate={addPanelDate}
            onClose={() => setShowAddPanel(false)}
            onSave={handleSaveTask}
          />
        )}
      </Suspense>
    </div>
  )
}
