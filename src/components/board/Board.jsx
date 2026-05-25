import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import { usePresence } from '../../hooks/usePresence'
import { useEditingBroadcast } from '../../hooks/useEditingBroadcast'
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
import WelcomeModal from '../ui/WelcomeModal'
import WorkspaceSettingsModal from '../workspace/WorkspaceSettingsModal'

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
  const { currentWorkspace, userRole, loading: wsLoading, autoSave } = useWorkspace()
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
  const [viewMode, setViewMode]             = useState(
    () => localStorage.getItem('tm_view_mode') ?? 'board'
  )
  const [welcomeData, setWelcomeData]       = useState(null)
  const [showWsSettings, setShowWsSettings] = useState(false)

  const searchRef      = useRef(null)
  const filterBarRef   = useRef(null)
  const pendingDeletes = useRef({})

  const playDoneSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      // Two-note ascending chime: C5 → E5
      const notes = [523.25, 659.25]
      notes.forEach((freq, i) => {
        const osc  = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch { /* audio not available — silently skip */ }
  }

  const present    = usePresence(currentWorkspace?.id)
  const editingMap = useEditingBroadcast(currentWorkspace?.id, selectedTaskId)

  const allTasks     = Object.values(tasksByStatus).flat()
  const selectedTask = allTasks.find(t => t.id === selectedTaskId) ?? null

  // Close panel if selected task is deleted
  useEffect(() => {
    if (selectedTaskId && !selectedTask) setSelectedTaskId(null)
  }, [selectedTaskId, selectedTask])

  // Persist view mode across reloads
  useEffect(() => {
    localStorage.setItem('tm_view_mode', viewMode)
  }, [viewMode])

  // Show welcome modal once after accepting a workspace invite
  useEffect(() => {
    const raw = localStorage.getItem('tm_welcome')
    if (!raw) return
    localStorage.removeItem('tm_welcome')
    try { setWelcomeData(JSON.parse(raw)) } catch { /* ignore malformed */ }
  }, [])

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

  const handleComplete = async (id) => {
    const task = allTasks.find(t => t.id === id)
    try {
      await updateTask(id, { status: 'done' })
      toast.success(`"${task?.text ?? 'Task'}" marked as done`)
      playDoneSound()
    } catch (err) {
      toast.error(err.message || 'Failed to update task')
    }
  }

  const scheduleDelete = (id, label) => {
    const timerId = setTimeout(async () => {
      delete pendingDeletes.current[id]
      try { await deleteTask(id) }
      catch (err) { toast.error(err.message || 'Failed to delete task') }
    }, 4000)
    pendingDeletes.current[id] = timerId
    toast.undo(`"${label}" deleted`, () => {
      clearTimeout(pendingDeletes.current[id])
      delete pendingDeletes.current[id]
    })
  }

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
        setSelectedTaskId(null)
        scheduleDelete(selectedTask.id, selectedTask.text)
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
      <Sidebar isOpen={showSidebar} />
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
  const doneTasks  = tasksByStatus['done']?.length ?? 0
  const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} />

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

            {canEdit && (
              <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
                + Add Task
              </button>
            )}

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

            {canDelete && (
              <button
                className="ws-settings-btn"
                onClick={() => setShowWsSettings(true)}
                aria-label="Workspace settings"
                title="Workspace settings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {totalTasks > 0 && (
          <div className="board-progress" title={`${doneTasks} of ${totalTasks} tasks done`}>
            <div
              className="board-progress-bar"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${doneTasks} of ${totalTasks} tasks done`}
            />
            <span className="board-progress-label">
              {doneTasks} / {totalTasks} done
            </span>
          </div>
        )}

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

        {userRole === 'owner' && totalTasks > 0 && (
          <div className="board-danger-row">
            <button className="btn-ghost btn-sm btn-danger-ghost" onClick={handleDeleteAll}>
              Delete all tasks
            </button>
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
                    onDelete={(id) => {
                      const task = allTasks.find(t => t.id === id)
                      scheduleDelete(id, task?.text ?? 'Task')
                    }}
                    onOpen={setSelectedTaskId}
                    onComplete={handleComplete}
                  />
                ))}
              </div>

              <DragOverlay dropAnimation={null}>
                {activeTask ? (
                  <TaskCard
                    task={activeTask}
                    isOverlay
                    canEdit={canEdit}
                    onOpen={() => {}}
                    editingUser={editingMap[activeTask.id] ?? null}
                  />
                ) : null}
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
              onDelete={(id) => {
                const task = allTasks.find(t => t.id === id)
                scheduleDelete(id, task?.text ?? 'Task')
              }}
              onOpen={setSelectedTaskId}
              onComplete={handleComplete}
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
          autoSave={autoSave}
          onUpdate={updateTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {showShortcuts  && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
      {showBugReport  && <BugReportSheet onClose={() => setShowBugReport(false)} />}
      {showWsSettings && <WorkspaceSettingsModal onClose={() => setShowWsSettings(false)} />}
      {welcomeData    && (
        <WelcomeModal
          workspaceName={welcomeData.workspace_name}
          invitedByName={welcomeData.invited_by_name}
          onClose={() => setWelcomeData(null)}
        />
      )}
    </div>
  )
}
