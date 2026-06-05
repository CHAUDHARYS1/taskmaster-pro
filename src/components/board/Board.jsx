import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { List, SquaresFour, Rows, GearSix, ClipboardText, Sparkle, Printer, CalendarBlank, SignOut, Coffee } from '@phosphor-icons/react'
import { fmtPrintNow } from '../../utils/format'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProject } from '../../contexts/ProjectContext'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'
import { useTasks } from '../../hooks/useTasks'
import { usePresence } from '../../hooks/usePresence'
import { useMembers } from '../../hooks/useMembers'
import { useEditingBroadcast } from '../../hooks/useEditingBroadcast'
import Sidebar from '../layout/Sidebar'
import Column from './Column'
import TaskCard from './TaskCard'
import PresenceAvatars from './PresenceAvatars'
import FilterBar from './FilterBar'
import BoardSkeleton from './BoardSkeleton'
import ListView from './ListView'
import { useToast } from '../../contexts/ToastContext'
import { useTaskReminders } from '../../hooks/useTaskReminders'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

const ProfileSettingsModal  = lazy(() => import('../ui/ProfileSettingsModal'))
const AddTaskPanel          = lazy(() => import('./AddTaskPanel'))
const TaskDetailPanel       = lazy(() => import('./TaskDetailPanel'))
const CalendarView          = lazy(() => import('../calendar/CalendarView'))
const ShortcutsHelp         = lazy(() => import('../ui/ShortcutsHelp'))
const WelcomeModal          = lazy(() => import('../ui/WelcomeModal'))
const MondayMotivationModal = lazy(() => import('../ui/MondayMotivationModal'))
const WorkspaceSettingsModal = lazy(() => import('../workspace/WorkspaceSettingsModal'))

function midpoint(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return b - 1000
  if (b == null) return a + 1000
  return (a + b) / 2
}

export const DEFAULT_COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function Board() {
  const { currentWorkspace, userRole, loading: wsLoading, autoSave, columnLabels, workspaceColumns } = useWorkspace()
  const { currentProject, projects, loading: projLoading } = useProject()
  const { user, profile, displayName, signOut } = useAuth()
  const { toggle: toggleTheme } = useTheme()

  // Keep the URL bar in sync so members can copy/share the direct link
  useEffect(() => {
    if (!currentWorkspace?.id) return
    const path = currentProject?.id
      ? `/workspace/${currentWorkspace.id}/project/${currentProject.id}`
      : `/workspace/${currentWorkspace.id}`
    window.history.replaceState(null, '', path)
  }, [currentWorkspace?.id, currentProject?.id])
  const isGlobalBoard = !currentProject && !!currentWorkspace
  const canEdit   = userRole !== 'viewer'
  const canDelete = userRole !== 'viewer'   // members can delete individual tasks
  const isOwner   = userRole === 'owner'    // owner-only bulk/workspace ops

  const { tasksByStatus, loading, error, addTask, reorderTask, deleteTask, archiveTask, updateTask, patchTaskChecklist } =
    useTasks(currentWorkspace?.id, currentProject?.id)

  const [showProfile, setShowProfile]       = useState(false)
  const [showModal, setShowModal]           = useState(false)
  const [activeTask, setActiveTask]         = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [filters, setFilters]               = useState({ search: '', assigneeId: '', priority: '', label: '', due: '', project: '' })
  const [showShortcuts, setShowShortcuts]   = useState(false)
  const [showSidebar, setShowSidebar]       = useState(false)
  const [viewMode, setViewMode]             = useState(() => {
    const saved = localStorage.getItem('tm_view_mode')
    return (saved === 'archive' || saved === 'trash' || !saved) ? 'board' : saved
  })
  const [welcomeData, setWelcomeData]       = useState(null)
  const [showWsSettings, setShowWsSettings]     = useState(false)
  const [showMondayModal, setShowMondayModal]   = useState(false)

  const searchRef      = useRef(null)
  const filterBarRef   = useRef(null)
  const pendingDeletes = useRef({})
  const doneAudioRef   = useRef(null)

  const playDoneSound = useCallback(() => {
    try {
      if (!doneAudioRef.current) {
        doneAudioRef.current = new Audio('/sound/done.mp3')
        doneAudioRef.current.volume = 0.5
      }
      doneAudioRef.current.currentTime = 0
      doneAudioRef.current.play().catch(() => {})
    } catch { /* silently skip */ }
  }, [])

  const playDeleteSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(300, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.25)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.25)
    } catch { /* silently skip */ }
  }

  const present                      = usePresence(currentWorkspace?.id)
  const { members: workspaceMembers } = useMembers(currentWorkspace?.id)
  const editingMap = useEditingBroadcast(currentWorkspace?.id, selectedTaskId)

  const allTasks     = useMemo(() => Object.values(tasksByStatus).flat(), [tasksByStatus])
  const selectedTask = allTasks.find(t => t.id === selectedTaskId) ?? null

  const columns = currentProject?.enabled_columns
    ? workspaceColumns.filter(c => currentProject.enabled_columns.includes(c.id))
    : workspaceColumns

  useEffect(() => {
    if (selectedTaskId && !selectedTask) setSelectedTaskId(null)
  }, [selectedTaskId, selectedTask])

  useEffect(() => {
    localStorage.setItem('tm_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    const raw = localStorage.getItem('tm_welcome')
    if (!raw) return
    localStorage.removeItem('tm_welcome')
    try { setWelcomeData(JSON.parse(raw)) } catch { /* ignore malformed */ }
  }, [])

  useEffect(() => {
    if (dayjs().day() !== 1) return  // only Monday (0 = Sun)
    const weekKey = dayjs().format('YYYY-[W]WW')
    if (localStorage.getItem('tm_monday_modal_week') === weekKey) return
    localStorage.setItem('tm_monday_modal_week', weekKey)
    setShowMondayModal(true)
  }, [])

  const { search, assigneeId, priority, label, due, project } = filters
  const hasFilter = !!(search || assigneeId || priority || label || due || project)

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
      if (project    && task.project_id !== project)      return false
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
  }, [tasksByStatus, hasFilter, search, assigneeId, priority, label, due, project])

  const navigateTask = (dir) => {
    if (!selectedTaskId) return
    const flat = Object.values(tasksByStatus).flat()
    const idx  = flat.findIndex(t => t.id === selectedTaskId)
    if (idx === -1) return
    const next = flat[idx + dir]
    if (next) setSelectedTaskId(next.id)
  }

  const { toast } = useToast()
  useTaskReminders(allTasks, toast, updateTask, columns)

  const handleComplete = useCallback(async (id) => {
    const task = allTasks.find(t => t.id === id)
    try {
      await updateTask(id, { status: 'done' })
      toast.success(`"${task?.text ?? 'Task'}" marked as done`)
      playDoneSound()
    } catch (err) {
      toast.error(err.message || 'Failed to update task')
    }
  }, [allTasks, updateTask, toast, playDoneSound])

  const scheduleDelete = useCallback((id, label) => {
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
  }, [deleteTask, toast])

  const handleColumnDelete = useCallback((id) => {
    const task = allTasks.find(t => t.id === id)
    scheduleDelete(id, task?.text ?? 'Task')
  }, [allTasks, scheduleDelete])

  const handleColumnArchive = useCallback(async (id) => {
    if (selectedTaskId === id) setSelectedTaskId(null)
    try {
      await archiveTask(id)
      toast.success('Task archived')
    } catch (err) {
      toast.error(err.message || 'Failed to archive task')
    }
  }, [archiveTask, selectedTaskId, toast])

  const handleQuickAdd = useCallback(async (text, description) => {
    try { await addTask({ text, description, status: 'toDo' }); toast.success('Task added') }
    catch (err) { toast.error(err.message || 'Failed to add task') }
  }, [addTask, toast])

  useKeyboardShortcuts({
    'ctrl+n': (e) => { e.preventDefault(); if (canEdit && !showModal && !selectedTaskId && !isGlobalBoard) setShowModal(true) },
    '/':      (e) => { e.preventDefault(); searchRef.current?.focus() },
    'ctrl+f': (e) => { e.preventDefault(); filterBarRef.current?.querySelector('input, select')?.focus() },
    '?':      () => setShowShortcuts(prev => !prev),
    'ctrl+b': (e) => { e.preventDefault(); setViewMode('board') },
    'ctrl+l': (e) => { e.preventDefault(); setViewMode('list') },
    'ctrl+d': (e) => { e.preventDefault(); toggleTheme() },
    'ArrowLeft':  () => navigateTask(-1),
    'ArrowRight': () => navigateTask(1),
    'Delete': () => {
      if (selectedTask && canDelete) {
        setSelectedTaskId(null)
        scheduleDelete(selectedTask.id, selectedTask.text)
      }
    },
    'Escape': () => {
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

  const handleDragCancel = () => {
    setActiveTask(null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!canEdit) return

    if (!over || active.id === over.id) return

    const all = Object.values(tasksByStatus).flat()
    const draggedTask = all.find(t => t.id === active.id)
    if (!draggedTask) return

    const isColumnTarget  = columns.some(c => c.id === over.id)
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

    if (targetColumnId === 'done' && draggedTask.status !== 'done') playDoneSound()
    reorderTask(active.id, targetColumnId, newPosition)
  }

  const escHtml = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

  const handlePrint = () => {
    const colData = columns.map(col => ({
      label: col.label,
      tasks: displayByStatus[col.id] ?? [],
    }))
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${escHtml(currentWorkspace?.name)} — Task Board</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111}
h1{font-size:18px;font-weight:700;margin-bottom:4px}
.sub{font-size:12px;color:#666;margin-bottom:20px}
.cols{display:grid;grid-template-columns:repeat(${colData.length},1fr);gap:14px}
.col{border:1px solid #e5e7eb;border-radius:8px;overflow:hidden}
.col-hdr{background:#f3f4f6;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#374151}
.col-body{padding:8px}
.task{border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;margin-bottom:6px}
.task-text{font-size:13px;color:#111;margin-bottom:4px}
.meta{display:flex;gap:8px;font-size:11px;color:#777;flex-wrap:wrap}
.pri{font-weight:600}.high{color:#ef4444}.medium{color:#f59e0b}.low{color:#6b7280}
.empty{font-size:12px;color:#9ca3af;padding:6px}
@media print{body{padding:10px}@page{margin:.5in}}
</style></head><body>
<h1>${escHtml(currentWorkspace?.name)}</h1>
<p class="sub">Printed ${fmtPrintNow()}</p>
<div class="cols">
${colData.map(c => `<div class="col">
  <div class="col-hdr">${escHtml(c.label)} (${c.tasks.length})</div>
  <div class="col-body">
    ${c.tasks.length === 0 ? '<p class="empty">No tasks</p>' : c.tasks.map(t => `<div class="task">
      <div class="task-text">${escHtml(t.text)}</div>
      ${t.priority || t.due_date ? `<div class="meta">
        ${t.priority ? `<span class="pri ${t.priority}">${t.priority}</span>` : ''}
        ${t.due_date ? `<span>Due ${dayjs(t.due_date).format('MMM D')}</span>` : ''}
      </div>` : ''}
    </div>`).join('')}
  </div>
</div>`).join('')}
</div></body></html>`

    const win = window.open('', '_blank')
    if (!win) { toast.error('Pop-ups blocked — allow pop-ups to print.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (wsLoading || projLoading || loading) return <BoardSkeleton />
  if (error)                 return <div className="error-screen">Error: {error}</div>

  if (!currentWorkspace) return (
    <div className="app-shell">
      <Sidebar isOpen={showSidebar} viewMode={viewMode} onViewChange={setViewMode} onShowShortcuts={() => setShowShortcuts(true)} />
      <main className="board-main">
        <div className="board-empty-state">
          <ClipboardText size={48} className="board-empty-icon" aria-hidden="true" />
          <h2 className="board-empty-title">No workspace selected</h2>
          <p className="board-empty-body">Create a workspace from the sidebar to get started.</p>
        </div>
      </main>
    </div>
  )

  const totalTasks     = allTasks.length
  const doneTasks      = tasksByStatus['done']?.length ?? 0
  const remainingTasks = totalTasks - doneTasks
  const remainingPct   = totalTasks > 0 ? Math.round((remainingTasks / totalTasks) * 100) : 0

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} viewMode={viewMode} onViewChange={setViewMode} onShowShortcuts={() => setShowShortcuts(true)} />

      <main id="main-content" className="board-main">
        <div className="utility-bar">
          <button
            className="utility-bar-profile"
            onClick={() => setShowProfile(true)}
            aria-label={`Edit profile for ${displayName || user?.email}`}
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="utility-bar-avatar utility-bar-avatar--photo" />
            ) : (
              <span className="utility-bar-avatar" style={{ background: userColor(user?.id) }} aria-hidden="true">
                {displayName ? displayName[0].toUpperCase() : '?'}
              </span>
            )}
            <span className="utility-bar-name">{displayName || user?.email}</span>
          </button>

          <div className="utility-bar-actions">
            <a
              href="https://buymeacoffee.com/schaudhary"
              target="_blank"
              rel="noreferrer"
              className="utility-bar-btn"
              aria-label="Buy me a coffee"
              data-tooltip="Buy me a coffee"
            >
              <Coffee size={14} weight="bold" aria-hidden="true" />
            </a>
            <div className="utility-bar-sep" aria-hidden="true" />
            <button
              className="utility-bar-btn"
              onClick={() => setShowWsSettings(true)}
              aria-label="Workspace settings"
              data-tooltip="Workspace settings"
            >
              <GearSix size={16} aria-hidden="true" />
            </button>
            <button
              className="utility-bar-btn utility-bar-btn--danger"
              onClick={signOut}
              aria-label="Sign out"
              data-tooltip="Sign out"
            >
              <SignOut size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(prev => !prev)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <span className="board-header-title">
              {currentWorkspace?.name}
              {isGlobalBoard
                ? <span className="board-header-project"> / All Projects</span>
                : currentProject && <span className="board-header-project"> / {currentProject.name}</span>
              }
            </span>
          </div>
          <div className="board-header-right">
            <PresenceAvatars members={workspaceMembers} present={present} />

            {/* View mode toggle */}
            <div className="view-toggle" role="group" aria-label="View mode">
              <button
                className={`view-toggle-btn${viewMode === 'board' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('board')}
                aria-pressed={viewMode === 'board'}
                title="Board view (B)"
              >
                <SquaresFour size={20} aria-hidden="true" />
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'list' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                title="List view (L)"
              >
                <Rows size={20} aria-hidden="true" />
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'calendar' ? ' view-toggle-btn--active' : ''}`}
                onClick={() => setViewMode('calendar')}
                aria-pressed={viewMode === 'calendar'}
                title="Calendar view (C)"
              >
                <CalendarBlank size={20} aria-hidden="true" />
              </button>
            </div>

            <button
              className="ws-settings-btn board-header-btn--print"
              onClick={handlePrint}
              aria-label="Print task board"
              title="Print board"
            >
              <Printer size={20} aria-hidden="true" />
            </button>

            <button
              className="ws-settings-btn"
              onClick={() => setShowWsSettings(true)}
              aria-label="Workspace settings"
              title="Workspace settings"
            >
              <GearSix size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Mobile view bar (second row, mobile-only) ──────────── */}
        <nav className="mob-view-bar" aria-label="View options">
          <button
            className={`mob-view-btn${viewMode === 'board' ? ' mob-view-btn--active' : ''}`}
            onClick={() => setViewMode('board')}
            aria-pressed={viewMode === 'board'}
          >
            <SquaresFour size={22} aria-hidden="true" />
            <span>Board</span>
          </button>
          <button
            className={`mob-view-btn${viewMode === 'list' ? ' mob-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-pressed={viewMode === 'list'}
          >
            <Rows size={22} aria-hidden="true" />
            <span>List</span>
          </button>
          <button
            className={`mob-view-btn${viewMode === 'calendar' ? ' mob-view-btn--active' : ''}`}
            onClick={() => setViewMode('calendar')}
            aria-pressed={viewMode === 'calendar'}
          >
            <CalendarBlank size={22} aria-hidden="true" />
            <span>Calendar</span>
          </button>
          <button
            className="mob-view-btn"
            onClick={handlePrint}
            aria-label="Print task board"
          >
            <Printer size={22} aria-hidden="true" />
            <span>Print</span>
          </button>
          <button
            className="mob-view-btn"
            onClick={() => setShowWsSettings(true)}
            aria-label="Workspace settings"
          >
            <GearSix size={22} aria-hidden="true" />
            <span>Settings</span>
          </button>
        </nav>

        {totalTasks > 0 && (
          <div className="board-progress" title={`${remainingTasks} of ${totalTasks} tasks remaining`}>
            <div
              className="board-progress-bar"
              style={{ width: `${remainingPct}%` }}
              role="progressbar"
              aria-valuenow={remainingPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${remainingTasks} of ${totalTasks} tasks remaining`}
            />
            <span className="board-progress-label">
              {remainingTasks} {remainingTasks === 1 ? 'task' : 'tasks'} left
            </span>
          </div>
        )}

        <div ref={filterBarRef}>
          <FilterBar
            workspaceId={currentWorkspace?.id}
            filters={filters}
            onChange={setFilters}
            searchRef={searchRef}
            onAdd={canEdit && !isGlobalBoard ? () => setShowModal(true) : undefined}
            projects={isGlobalBoard ? projects : undefined}
          />
        </div>

        {userRole === 'viewer' && (
          <div className="viewer-banner">
            You have view-only access to this workspace.
          </div>
        )}

        {/* ── Canvas: board content + detail panel side-by-side ── */}
        <div className="board-canvas">
          <div className="board-canvas__content">
            {totalTasks === 0 && !hasFilter && canEdit && !isGlobalBoard && (
              <div className="board-empty-state">
                <Sparkle size={48} className="board-empty-icon" aria-hidden="true" />
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
                  onDragCancel={handleDragCancel}
                >
                  <div className="board-columns">
                    {columns.map(col => (
                      <Column
                        key={col.id}
                        column={col}
                        tasks={displayByStatus[col.id] ?? []}
                        canEdit={canEdit}
                        hasFilter={hasFilter}
                        canDelete={canDelete}
                        editingMap={editingMap}
                        showProject={isGlobalBoard}
                        onDelete={handleColumnDelete}
                        onArchive={handleColumnArchive}
                        onOpen={setSelectedTaskId}
                        onComplete={handleComplete}
                        onQuickAdd={col.id === 'toDo' && !isGlobalBoard ? handleQuickAdd : undefined}
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
            ) : viewMode === 'list' ? (
              <div className="list-view-wrap">
                <ListView
                  columns={columns}
                  tasksByStatus={displayByStatus}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  editingMap={editingMap}
                  showProject={isGlobalBoard}
                  onDelete={handleColumnDelete}
                  onArchive={handleColumnArchive}
                  onOpen={setSelectedTaskId}
                  onComplete={handleComplete}
                />
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="cal-page-body">
                <Suspense fallback={null}>
                  <CalendarView tasks={allTasks} onTaskClick={t => setSelectedTaskId(t.id)} />
                </Suspense>
              </div>
            ) : null}
          </div>

          {/* Panels sit inside the canvas as flex siblings — not fixed overlays */}
          <Suspense fallback={null}>
            {showModal && canEdit && (
              <AddTaskPanel
                columns={columns}
                onClose={() => setShowModal(false)}
                onSave={async (data) => {
                  const taskId = await addTask(data)
                  toast.success('Task added')
                  return taskId
                }}
              />
            )}

            {selectedTask && (
              <TaskDetailPanel
                task={selectedTask}
                columns={columns}
                canEdit={canEdit}
                autoSave={autoSave}
                onUpdate={(id, changes) => {
                  if (changes.status === 'done' && selectedTask?.status !== 'done') playDoneSound()
                  return updateTask(id, changes)
                }}
                onChecklistChange={patchTaskChecklist}
                onClose={() => setSelectedTaskId(null)}
              />
            )}
          </Suspense>
        </div>
      </main>

      <Suspense fallback={null}>
        {showShortcuts  && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
        {showWsSettings && <WorkspaceSettingsModal onClose={() => setShowWsSettings(false)} canEdit={canEdit} canDelete={canDelete} />}
        {showProfile    && <ProfileSettingsModal   onClose={() => setShowProfile(false)} />}
        {welcomeData    && (
          <WelcomeModal
            workspaceName={welcomeData.workspace_name}
            invitedByName={welcomeData.invited_by_name}
            onClose={() => setWelcomeData(null)}
          />
        )}
        {showMondayModal && currentWorkspace && (
          <MondayMotivationModal
            workspaceId={currentWorkspace.id}
            firstName={profile?.first_name}
            onClose={() => setShowMondayModal(false)}
          />
        )}
      </Suspense>
    </div>
  )
}
