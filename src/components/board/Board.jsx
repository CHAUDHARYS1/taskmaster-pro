import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import { usePresence } from '../../hooks/usePresence'
import Sidebar from '../layout/Sidebar'
import Column from './Column'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import PresenceAvatars from './PresenceAvatars'
import TaskDetailPanel from './TaskDetailPanel'
import FilterBar from './FilterBar'
import BoardSkeleton from './BoardSkeleton'
import ListView from './ListView'
import { useToast } from '../../contexts/ToastContext'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import ShortcutsHelp from '../ui/ShortcutsHelp'
import BugReportSheet from '../ui/BugReportSheet'

function midpoint(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return b - 1000
  if (b == null) return a + 1000
  return (a + b) / 2
}

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function Board() {
  const { currentWorkspace, userRole, loading: wsLoading } = useWorkspace()
  const { user } = useAuth()
  const { toggle: toggleTheme } = useTheme()
  const canEdit   = userRole !== 'viewer'
  const canDelete = userRole === 'owner'

  const { tasksByStatus, loading, error, addTask, reorderTask, deleteTask, updateTask } =
    useTasks(currentWorkspace?.id)

  const [showModal, setShowModal]           = useState(false)
  const [activeTask, setActiveTask]         = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [filters, setFilters]               = useState({ search: '', assigneeId: '', priority: '', label: '', due: '' })
  const [showShortcuts, setShowShortcuts]   = useState(false)
  const [showBugReport, setShowBugReport]   = useState(false)
  const [showSidebar, setShowSidebar]       = useState(false)
  const [viewMode, setViewMode]             = useState('board') // 'board' | 'list'

  const searchRef = useRef(null)
  const filterBarRef = useRef(null)

  const present = usePresence(currentWorkspace?.id, selectedTaskId)

  const allTasks     = Object.values(tasksByStatus).flat()
  const selectedTask = allTasks.find(t => t.id === selectedTaskId) ?? null

  // Map of taskId → presence user currently editing it (excludes current user)
  const editingMap = useMemo(() => {
    const map = {}
    for (const u of present) {
      if (u.editing_task_id && u.user_id !== user?.id) {
        map[u.editing_task_id] = u
      }
    }
    return map
  }, [present, user?.id])

  // Close panel if selected task is deleted
  useEffect(() => {
    if (selectedTaskId && !selectedTask) setSelectedTaskId(null)
  }, [selectedTaskId, selectedTask])

  const { search, assigneeId, priority, label, due } = filters
  const hasFilter = !!(search || assigneeId || priority || label || due)

  const displayByStatus = useMemo(() => {
    if (!hasFilter) return tasksByStatus

    const today = dayjs().startOf('day')
    const applyFilter = tasks => tasks.filter(task => {
      if (search) {
        const q = search.toLowerCase()
        if (!task.text?.toLowerCase().includes(q) &&
            !task.description?.toLowerCase().includes(q)) return false
      }
      if (assigneeId && task.assignee_id !== assigneeId) return false
      if (priority   && task.priority !== priority)       return false
      if (label      && !(task.labels ?? []).includes(label)) return false
      if (due) {
        const d = task.due_date ? dayjs(task.due_date) : null
        if (due === 'overdue' && (!d || !d.isBefore(today)))                                  return false
        if (due === 'today'   && (!d || !d.isSame(today, 'day')))                             return false
        if (due === 'week'    && (!d || d.isBefore(today) || d.isAfter(today.add(7, 'day')))) return false
        if (due === 'none'    && d)                                                            return false
      }
      return true
    })

    return Object.fromEntries(
      Object.entries(tasksByStatus).map(([status, tasks]) => [status, applyFilter(tasks)])
    )
  }, [tasksByStatus, hasFilter, search, assigneeId, priority, label, due])

  // Navigate prev/next task when panel is open
  const navigateTask = (dir) => {
    if (!selectedTaskId) return
    const flat = Object.values(tasksByStatus).flat()
    const idx  = flat.findIndex(t => t.id === selectedTaskId)
    if (idx === -1) return
    const next = flat[idx + dir]
    if (next) setSelectedTaskId(next.id)
  }

  const { toast } = useToast()

  useKeyboardShortcuts({
    'n': (e) => { e.preventDefault(); if (canEdit && !showModal && !selectedTaskId) setShowModal(true) },
    '/': (e) => { e.preventDefault(); searchRef.current?.focus() },
    'f': (e) => { e.preventDefault(); filterBarRef.current?.querySelector('input, select')?.focus() },
    '?': () => setShowShortcuts(prev => !prev),
    'b': (e) => { e.preventDefault(); setViewMode('board') },
    'l': (e) => { e.preventDefault(); setViewMode('list') },
    'd': (e) => { e.preventDefault(); toggleTheme() },
    'ArrowLeft':  () => navigateTask(-1),
    'ArrowRight': () => navigateTask(1),
    'Delete': () => {
      if (selectedTask && canDelete) {
        if (window.confirm(`Delete "${selectedTask.text}"?`)) {
          deleteTask(selectedTask.id)
            .then(() => { toast.success('Task deleted'); setSelectedTaskId(null) })
            .catch(err => toast.error(err.message || 'Failed to delete'))
        }
      }
    },
    'Escape': () => {
      if (showBugReport)  { setShowBugReport(false); return }
      if (showShortcuts)  { setShowShortcuts(false); return }
      if (selectedTaskId) { setSelectedTaskId(null); return }
      if (showModal)      { setShowModal(false) }
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }) => {
    if (!canEdit) return
    const all = Object.values(tasksByStatus).flat()
    setActiveTask(all.find(t => t.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!canEdit || !over || active.id === over.id) return

    const all = Object.values(tasksByStatus).flat()
    const draggedTask = all.find(t => t.id === active.id)
    if (!draggedTask) return

    const isColumnTarget  = COLUMNS.some(c => c.id === over.id)
    const targetColumnId  = isColumnTarget
      ? over.id
      : (all.find(t => t.id === over.id)?.status ?? draggedTask.status)

    const sourceTasks = tasksByStatus[draggedTask.status] ?? []
    const targetTasks = tasksByStatus[targetColumnId]   ?? []

    let newPosition

    if (isColumnTarget) {
      const last = targetTasks[targetTasks.length - 1]
      newPosition = last ? last.position + 1000 : 0
    } else {
      const overIndex = targetTasks.findIndex(t => t.id === over.id)

      if (draggedTask.status === targetColumnId) {
        const activeIndex = sourceTasks.findIndex(t => t.id === active.id)
        const reordered   = arrayMove(sourceTasks, activeIndex, overIndex)
        const newIndex    = reordered.findIndex(t => t.id === active.id)
        newPosition = midpoint(reordered[newIndex - 1]?.position, reordered[newIndex + 1]?.position)
      } else {
        newPosition = midpoint(targetTasks[overIndex]?.position, targetTasks[overIndex + 1]?.position)
      }
    }

    reorderTask(active.id, targetColumnId, newPosition)
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all tasks? This cannot be undone.')) return
    const all = Object.values(tasksByStatus).flat()
    try {
      await Promise.all(all.map(t => deleteTask(t.id)))
      toast.success('All tasks deleted')
    } catch { toast.error('Failed to delete tasks') }
  }

  if (wsLoading || loading) return <BoardSkeleton />
  if (error)                 return <div className="error-screen">Error: {error}</div>

  if (!currentWorkspace) return (
    <div className="app-shell">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} onAddTask={() => setShowModal(true)} onDeleteAll={handleDeleteAll} />
      <main className="board-main">
        <div className="board-empty-state">
          <p className="board-empty-icon" aria-hidden="true">📋</p>
          <h2 className="board-empty-title">No workspace selected</h2>
          <p className="board-empty-body">Create a workspace from the sidebar to get started.</p>
        </div>
      </main>
    </div>
  )

  const totalTasks = allTasks.length

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onAddTask={() => { setShowModal(true); setShowSidebar(false) }}
        onDeleteAll={handleDeleteAll}
      />

      <main className="board-main">
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(prev => !prev)}
              aria-label="Toggle sidebar"
            >
              ☰
            </button>
            <span className="board-header-title">{currentWorkspace?.name}</span>
          </div>
          <div className="board-header-right">
            <PresenceAvatars users={present} />

            {/* View toggle */}
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                className={`view-toggle-btn${viewMode === 'board' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('board')}
                aria-pressed={viewMode === 'board'}
                title="Board view (B)"
              >
                <span aria-hidden="true">⊞</span>
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'list' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                title="List view (L)"
              >
                <span aria-hidden="true">☰</span>
              </button>
            </div>

            <button
              className="shortcuts-hint-btn"
              onClick={() => setShowShortcuts(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
            >
              ?
            </button>

            <button
              className="bug-report-btn"
              onClick={() => setShowBugReport(true)}
              aria-label="Report a bug or request a feature"
              title="Report a bug / request a feature"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22c1.1 0 2-.9 2-2H10c0 1.1.9 2 2 2z"/>
                <path d="M18 16v-5a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v5l-2 2h16l-2-2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div ref={filterBarRef}>
          <FilterBar
            workspaceId={currentWorkspace?.id}
            filters={filters}
            onChange={setFilters}
            searchRef={searchRef}
          />
        </div>

        {userRole === 'viewer' && (
          <div className="viewer-banner">
            You have view-only access to this workspace.
          </div>
        )}

        {totalTasks === 0 && !hasFilter && canEdit && (
          <div className="board-empty-state">
            <p className="board-empty-icon" aria-hidden="true">✦</p>
            <h2 className="board-empty-title">Your board is empty</h2>
            <p className="board-empty-body">Add your first task to get started.</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Task</button>
          </div>
        )}

        {viewMode === 'board' ? (
          <div className="board-columns-wrap">
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="board-columns">
                {COLUMNS.map(col => (
                  <Column
                    key={col.id}
                    column={col}
                    tasks={displayByStatus[col.id] ?? []}
                    canEdit={canEdit}
                    hasFilter={hasFilter}
                    canDelete={canDelete}
                    editingMap={editingMap}
                    onDelete={async (id) => {
                      try { await deleteTask(id); toast.success('Task deleted') }
                      catch (err) { toast.error(err.message || 'Failed to delete task') }
                    }}
                    onOpen={setSelectedTaskId}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeTask ? <TaskCard task={activeTask} isDragging canEdit={canEdit} onOpen={() => {}} /> : null}
              </DragOverlay>
            </DndContext>
          </div>
        ) : (
          <div className="list-view-wrap">
            <ListView
              tasksByStatus={displayByStatus}
              canEdit={canEdit}
              canDelete={canDelete}
              editingMap={editingMap}
              onDelete={async (id) => {
                try { await deleteTask(id); toast.success('Task deleted') }
                catch (err) { toast.error(err.message || 'Failed to delete task') }
              }}
              onOpen={setSelectedTaskId}
            />
          </div>
        )}
      </main>

      {showModal && canEdit && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => {
            try { await addTask(data); toast.success('Task added'); setShowModal(false) }
            catch (err) { toast.error(err.message || 'Failed to add task') }
          }}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          canEdit={canEdit}
          onUpdate={updateTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {showShortcuts  && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      {showBugReport  && <BugReportSheet onClose={() => setShowBugReport(false)} />}
    </div>
  )
}
