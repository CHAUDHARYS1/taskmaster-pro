import { createPortal } from 'react-dom'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { CaretLeft, CaretRight, Check, X, Funnel, Plus, CalendarBlank, Trash } from '@phosphor-icons/react'
import { fmtTimeStr } from '../../utils/format'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_STYLE = {
  toDo:       { color: 'var(--ink-3)',  bg: 'var(--paper-3)' },
  inProgress: { color: 'var(--accent)', bg: 'var(--accent-muted, rgba(37,99,235,0.1))' },
  inReview:   { color: 'var(--amber)',  bg: 'rgba(245,158,11,0.12)' },
  done:       { color: 'var(--green)',  bg: 'rgba(34,197,94,0.12)' },
}

const STATUS_LABELS   = { toDo: 'To Do', inProgress: 'In Progress', inReview: 'In Review', done: 'Done' }
const PRIORITY_LABELS = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' }

function getChipStyle(task, colorBy) {
  if (colorBy === 'project' && task.project?.color) {
    const c = task.project.color
    return { color: c, bg: c + '33' }
  }
  return STATUS_STYLE[task.status] ?? STATUS_STYLE.toDo
}

// ── EventChip ─────────────────────────────────────────────────────────────────
function EventChip({ task, onClick, colorBy = 'status', isDraggable, onDragStart, onDragEnd, onContextMenu, onDelete }) {
  const s              = getChipStyle(task, colorBy)
  const [arming, setArming] = useState(false)

  if (arming) {
    return (
      <div
        className="cal-event cal-event--arming"
        style={{ '--ev-color': 'var(--red)', '--ev-bg': 'var(--red-tint)' }}
        role="group"
        aria-label={`Delete "${task.text}"?`}
      >
        <span className="cal-event-text">Delete?</span>
        <div className="cal-event-del-confirm">
          <button
            type="button"
            className="cal-event-del-yes"
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            aria-label="Confirm delete"
          >
            <Check size={9} weight="bold" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="cal-event-del-no"
            onClick={e => { e.stopPropagation(); setArming(false) }}
            aria-label="Cancel"
          >
            <X size={9} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      className={[
        'cal-event',
        task.status === 'done' ? 'cal-event--done' : '',
        isDraggable ? 'cal-event--drag' : '',
        onDelete ? 'cal-event--deletable' : '',
      ].filter(Boolean).join(' ')}
      style={{ '--ev-color': s.color, '--ev-bg': s.bg }}
      onClick={e => { e.stopPropagation(); onClick(task) }}
      onContextMenu={onContextMenu ? e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, task) } : undefined}
      title={task.text}
      draggable={isDraggable || false}
      onDragStart={isDraggable ? onDragStart : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {task.due_time && <span className="cal-event-time">{fmtTimeStr(task.due_time)}</span>}
      <span className="cal-event-text">{task.text}</span>
      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          className="cal-event-del-btn"
          onClick={e => { e.stopPropagation(); setArming(true) }}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.stopPropagation(), setArming(true))}
          aria-label={`Delete task: ${task.text}`}
          title="Delete task"
        >
          <X size={9} weight="bold" aria-hidden="true" />
        </span>
      )}
    </button>
  )
}

// ── QuickAddForm ──────────────────────────────────────────────────────────────
function QuickAddForm({ date, projectOptions, defaultProject, onAdd, onCancel }) {
  const [text,    setText]    = useState('')
  const [project, setProject] = useState(defaultProject || projectOptions[0]?.value || '')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Sync when projects finish loading after the form was already mounted
  useEffect(() => {
    if (!project && (defaultProject || projectOptions[0]?.value)) {
      setProject(defaultProject || projectOptions[0]?.value || '')
    }
  }, [defaultProject, projectOptions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = text.trim()
    if (!trimmed) return
    const [wsId, projectId] = (project || '').split('|')
    onAdd(date, trimmed, wsId, projectId)
  }

  return (
    <form className="cal-quick-add" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
      <input
        ref={inputRef}
        className="cal-quick-add-input"
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Escape' && onCancel()}
        placeholder="Task name…"
        aria-label="New task name"
      />
      {projectOptions.length > 1 && (
        <select
          className="cal-quick-add-select"
          value={project}
          onChange={e => setProject(e.target.value)}
          aria-label="Project"
        >
          {projectOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      )}
      <div className="cal-quick-add-actions">
        <button type="submit" className="cal-quick-add-btn cal-quick-add-btn--add" disabled={!text.trim() || (projectOptions.length > 0 && !project)} aria-label="Add task">
          <Check size={10} weight="bold" aria-hidden="true" /> Add
        </button>
        <button type="button" className="cal-quick-add-btn cal-quick-add-btn--cancel" onClick={onCancel} aria-label="Cancel">
          <X size={10} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

// ── ContextMenu ───────────────────────────────────────────────────────────────
function ContextMenu({ x, y, dayKey, task, onAddToDay, onReschedule, onDelete, onClose }) {
  const ref         = useRef(null)
  const dateInputRef = useRef(null)
  const [step,     setStep]     = useState('main') // 'main' | 'move' | 'confirmDelete'
  const [moveDate, setMoveDate] = useState(task?.due_date?.slice(0, 10) ?? '')

  useEffect(() => {
    const handleDown = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const handleKey  = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleDown)
    document.addEventListener('keydown',   handleKey)
    return () => {
      document.removeEventListener('mousedown', handleDown)
      document.removeEventListener('keydown',   handleKey)
    }
  }, [onClose])

  useEffect(() => {
    if (step === 'move') dateInputRef.current?.focus()
  }, [step])

  // Constrain to viewport
  const safeX = Math.min(x, window.innerWidth  - 216)
  const safeY = Math.min(y, window.innerHeight - 160)

  const dateLabel = dayjs(dayKey).format('MMM D')

  return createPortal(
    <div
      ref={ref}
      className="cal-ctx-menu"
      style={{ position: 'fixed', top: safeY, left: safeX, zIndex: 2000 }}
      role="menu"
      aria-label="Calendar options"
    >
      {step === 'main' && (
        <>
          <button
            type="button"
            className="cal-ctx-item"
            role="menuitem"
            onClick={() => { onAddToDay(dayKey); onClose() }}
          >
            <Plus size={13} aria-hidden="true" />
            Add task{task ? ' here' : ` on ${dateLabel}`}
          </button>

          {task && (
            <>
              <div className="cal-ctx-divider" role="separator" />
              <div className="cal-ctx-task-name" title={task.text}>{task.text}</div>
              <button
                type="button"
                className="cal-ctx-item"
                role="menuitem"
                onClick={() => setStep('move')}
              >
                <CalendarBlank size={13} aria-hidden="true" />
                Move to date…
              </button>
              <button
                type="button"
                className="cal-ctx-item cal-ctx-item--danger"
                role="menuitem"
                onClick={() => setStep('confirmDelete')}
              >
                <Trash size={13} aria-hidden="true" />
                Delete task
              </button>
            </>
          )}
        </>
      )}

      {step === 'move' && (
        <div className="cal-ctx-move">
          <p className="cal-ctx-section-label">Move to</p>
          <input
            ref={dateInputRef}
            type="date"
            className="cal-ctx-date-input"
            value={moveDate}
            onChange={e => setMoveDate(e.target.value)}
          />
          <div className="cal-ctx-row-btns">
            <button
              type="button"
              className="cal-ctx-btn cal-ctx-btn--primary"
              disabled={!moveDate || moveDate === task?.due_date?.slice(0, 10)}
              onClick={() => { onReschedule(task.id, moveDate); onClose() }}
            >
              Move
            </button>
            <button type="button" className="cal-ctx-btn" onClick={() => setStep('main')}>
              Back
            </button>
          </div>
        </div>
      )}

      {step === 'confirmDelete' && (
        <div className="cal-ctx-confirm">
          <p className="cal-ctx-section-label">Delete this task?</p>
          <p className="cal-ctx-confirm-name" title={task.text}>{task.text}</p>
          <div className="cal-ctx-row-btns">
            <button
              type="button"
              className="cal-ctx-btn cal-ctx-btn--danger"
              onClick={() => { onDelete(task.id); onClose() }}
            >
              Delete
            </button>
            <button type="button" className="cal-ctx-btn" onClick={() => setStep('main')}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  )
}

// ── OverflowPopover ───────────────────────────────────────────────────────────
function OverflowPopover({ triggerRect, events, onTaskClick, onClose, colorBy, onChipContextMenu, onDeleteTask }) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = e => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [onClose])

  const top  = Math.min(triggerRect.bottom + 4, window.innerHeight - 260)
  const left = Math.max(4, Math.min(triggerRect.left, window.innerWidth - 224))

  return createPortal(
    <div
      ref={ref}
      className="cal-overflow-pop"
      style={{ position: 'fixed', top, left, zIndex: 1000 }}
      role="dialog"
      aria-label="All tasks for this day"
    >
      <div className="cal-overflow-pop-hdr">
        <span className="cal-overflow-pop-title">
          {events[0]?.due_date ? dayjs(events[0].due_date).format('MMMM D') : 'Tasks'}
        </span>
        <button type="button" className="cal-overflow-pop-close" onClick={onClose} aria-label="Close">
          <X size={12} weight="bold" aria-hidden="true" />
        </button>
      </div>
      <div className="cal-overflow-pop-list">
        {events.map(t => (
          <EventChip
            key={t.id}
            task={t}
            onClick={task => { onTaskClick(task); onClose() }}
            colorBy={colorBy}
            onContextMenu={onChipContextMenu}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}

// ── MiniSidebar ───────────────────────────────────────────────────────────────
function MiniSidebar({ mainCursor, onDayClick, tasksByDate }) {
  const [miniMonth, setMiniMonth] = useState(() => mainCursor.startOf('month'))
  const today = dayjs().format('YYYY-MM-DD')

  const mainMonthKey = mainCursor.format('YYYY-MM')
  useEffect(() => {
    setMiniMonth(mainCursor.startOf('month'))
  }, [mainMonthKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const gridStart = miniMonth.startOf('week')
  const cells     = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'))

  return (
    <aside className="cal-mini-sidebar" aria-label="Mini calendar">
      <div className="cal-mini-nav">
        <button type="button" className="cal-mini-nav-btn" onClick={() => setMiniMonth(m => m.subtract(1, 'month'))} aria-label="Previous month">
          <CaretLeft size={10} weight="bold" aria-hidden="true" />
        </button>
        <span className="cal-mini-month-label">{miniMonth.format('MMM YYYY')}</span>
        <button type="button" className="cal-mini-nav-btn" onClick={() => setMiniMonth(m => m.add(1, 'month'))} aria-label="Next month">
          <CaretRight size={10} weight="bold" aria-hidden="true" />
        </button>
      </div>

      <div className="cal-mini-dow-row">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <span key={i} className="cal-mini-dow-cell">{d}</span>
        ))}
      </div>

      <div className="cal-mini-grid">
        {cells.map(day => {
          const key      = day.format('YYYY-MM-DD')
          const isToday  = key === today
          const isOther  = day.month() !== miniMonth.month()
          const hasTasks = !isOther && Boolean(tasksByDate[key]?.length)
          return (
            <button
              key={key}
              type="button"
              className={['cal-mini-day', isToday ? 'cal-mini-day--today' : '', isOther ? 'cal-mini-day--other' : ''].filter(Boolean).join(' ')}
              onClick={() => onDayClick(day)}
              aria-label={day.format('MMMM D YYYY')}
              title={day.format('MMMM D')}
            >
              {day.date()}
              {hasTasks && <span className="cal-mini-dot" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

// ── FilterBar ─────────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange, assignees }) {
  const hasActive = Object.values(filters).some(Boolean)
  return (
    <div className="cal-filter-bar">
      <select className={`cal-filter-select${filters.status ? ' cal-filter-select--active' : ''}`} value={filters.status} onChange={e => onChange({ ...filters, status: e.target.value })} aria-label="Filter by status">
        <option value="">All statuses</option>
        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select className={`cal-filter-select${filters.priority ? ' cal-filter-select--active' : ''}`} value={filters.priority} onChange={e => onChange({ ...filters, priority: e.target.value })} aria-label="Filter by priority">
        <option value="">All priorities</option>
        {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {assignees.length > 0 && (
        <select className={`cal-filter-select${filters.assignee ? ' cal-filter-select--active' : ''}`} value={filters.assignee} onChange={e => onChange({ ...filters, assignee: e.target.value })} aria-label="Filter by assignee">
          <option value="">All assignees</option>
          {assignees.map(email => <option key={email} value={email}>{email}</option>)}
        </select>
      )}
      {hasActive && (
        <button type="button" className="cal-filter-clear" onClick={() => onChange({ status: '', priority: '', assignee: '' })}>Clear</button>
      )}
    </div>
  )
}

// ── MonthView ─────────────────────────────────────────────────────────────────
function MonthView({
  cursor, tasksByDate, onTaskClick, onDayClick,
  addingDay, setAddingDay, projectOptions, defaultProject, onQuickAdd,
  colorBy, setOverflowData,
  dragOverDay, setDragOverDay, onReschedule, onDragStart, onDragEnd,
  onOpenCtxMenu, onDeleteTask,
}) {
  const today     = dayjs().format('YYYY-MM-DD')
  const gridStart = cursor.startOf('month').startOf('week')
  const cells     = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'))

  const handleDrop = useCallback((e, key) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) onReschedule(taskId, key)
    setDragOverDay(null)
  }, [onReschedule, setDragOverDay])

  return (
    <div className="cal-month">
      <div className="cal-dow-row">
        {DOW.map(d => <div key={d} className="cal-dow-cell">{d}</div>)}
      </div>
      <div className="cal-month-grid">
        {cells.map(day => {
          const key        = day.format('YYYY-MM-DD')
          const events     = tasksByDate[key] ?? []
          const isToday    = key === today
          const isOther    = day.month() !== cursor.month()
          const visible    = events.slice(0, 3)
          const overflow   = events.length - 3
          const isAdding   = addingDay === key
          const isDragOver = dragOverDay === key

          return (
            <div
              key={key}
              className={['cal-day', isToday ? 'cal-day--today' : '', isOther ? 'cal-day--other' : '', isAdding ? 'cal-day--adding' : '', isDragOver ? 'cal-day--drag-over' : ''].filter(Boolean).join(' ')}
              onClick={() => !isAdding && onDayClick(day)}
              onContextMenu={e => { e.preventDefault(); onOpenCtxMenu(e, key, null) }}
              role={isAdding ? undefined : 'button'}
              tabIndex={isAdding ? undefined : 0}
              onKeyDown={e => !isAdding && (e.key === 'Enter' || e.key === ' ') && onDayClick(day)}
              aria-label={isAdding ? undefined : `${day.format('MMMM D')}, ${events.length} task${events.length !== 1 ? 's' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOverDay(key) }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null) }}
              onDrop={e => handleDrop(e, key)}
            >
              <div className="cal-day-header">
                <span className="cal-day-num">{day.date()}</span>
                {!isAdding && !isOther && projectOptions.length > 0 && (
                  <button
                    type="button"
                    className="cal-day-add-btn"
                    onClick={e => { e.stopPropagation(); setAddingDay(key) }}
                    aria-label={`Add task on ${day.format('MMMM D')}`}
                    title={`Add task on ${day.format('MMMM D')}`}
                  >
                    <Plus size={11} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>

              {isAdding ? (
                <QuickAddForm
                  date={key}
                  projectOptions={projectOptions}
                  defaultProject={defaultProject}
                  onAdd={(date, text, wsId, projectId) => { onQuickAdd(date, text, wsId, projectId); setAddingDay(null) }}
                  onCancel={() => setAddingDay(null)}
                />
              ) : (
                <div className="cal-day-events">
                  {visible.map(t => (
                    <EventChip
                      key={t.id}
                      task={t}
                      onClick={onTaskClick}
                      colorBy={colorBy}
                      isDraggable
                      onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('text/plain', t.id); onDragStart(t.id) }}
                      onDragEnd={onDragEnd}
                      onContextMenu={(e, task) => onOpenCtxMenu(e, key, task)}
                      onDelete={onDeleteTask}
                    />
                  ))}
                  {overflow > 0 && (
                    <button
                      type="button"
                      className="cal-overflow"
                      onClick={e => { e.stopPropagation(); setOverflowData({ rect: e.currentTarget.getBoundingClientRect(), dayKey: key }) }}
                    >
                      +{overflow} more
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── WeekView ──────────────────────────────────────────────────────────────────
function WeekView({
  cursor, tasksByDate, onTaskClick, onDayClick,
  addingDay, setAddingDay, projectOptions, defaultProject, onQuickAdd,
  colorBy, dragOverDay, setDragOverDay, onReschedule, onDragStart, onDragEnd,
  onOpenCtxMenu, onDeleteTask,
}) {
  const today = dayjs().format('YYYY-MM-DD')
  const days  = Array.from({ length: 7 }, (_, i) => cursor.startOf('week').add(i, 'day'))

  return (
    <div className="cal-week">
      {days.map(day => {
        const key        = day.format('YYYY-MM-DD')
        const events     = tasksByDate[key] ?? []
        const isToday    = key === today
        const isAdding   = addingDay === key
        const isDragOver = dragOverDay === key

        return (
          <div
            key={key}
            className={['cal-week-col', isToday ? 'cal-week-col--today' : '', isDragOver ? 'cal-week-col--drag-over' : ''].filter(Boolean).join(' ')}
            onContextMenu={e => { e.preventDefault(); onOpenCtxMenu(e, key, null) }}
            onDragOver={e => { e.preventDefault(); setDragOverDay(key) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverDay(null) }}
            onDrop={e => { e.preventDefault(); const taskId = e.dataTransfer.getData('text/plain'); if (taskId) onReschedule(taskId, key); setDragOverDay(null) }}
          >
            <div className="cal-week-hdr-wrap">
              <button type="button" className="cal-week-hdr" onClick={() => onDayClick(day)}>
                <span className="cal-week-dow">{DOW[day.day()]}</span>
                <span className={`cal-week-date${isToday ? ' cal-week-date--today' : ''}`}>{day.date()}</span>
              </button>
              {!isAdding && projectOptions.length > 0 && (
                <button
                  type="button"
                  className="cal-week-add-btn"
                  onClick={() => setAddingDay(key)}
                  aria-label={`Add task on ${day.format('MMMM D')}`}
                  title={`Add task on ${day.format('MMMM D')}`}
                >
                  <Plus size={11} weight="bold" aria-hidden="true" />
                </button>
              )}
            </div>

            {isAdding && (
              <QuickAddForm
                date={key}
                projectOptions={projectOptions}
                defaultProject={defaultProject}
                onAdd={(date, text, wsId, projectId) => { onQuickAdd(date, text, wsId, projectId); setAddingDay(null) }}
                onCancel={() => setAddingDay(null)}
              />
            )}

            <div className="cal-week-events">
              {events.map(t => (
                <EventChip
                  key={t.id}
                  task={t}
                  onClick={onTaskClick}
                  colorBy={colorBy}
                  isDraggable
                  onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); onDragStart(t.id) }}
                  onDragEnd={onDragEnd}
                  onContextMenu={(e, task) => onOpenCtxMenu(e, key, task)}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── DayView ───────────────────────────────────────────────────────────────────
function DayView({ cursor, tasksByDate, onTaskClick, addingDay, setAddingDay, projectOptions, defaultProject, onQuickAdd, colorBy, onOpenCtxMenu, onDeleteTask }) {
  const key    = cursor.format('YYYY-MM-DD')
  const events = tasksByDate[key] ?? []
  const allDay = events.filter(t => !t.due_time)
  const timed  = events.filter(t => t.due_time).sort((a, b) => (a.due_time < b.due_time ? -1 : 1))

  return (
    <div className="cal-day-view" onContextMenu={e => { e.preventDefault(); onOpenCtxMenu(e, key, null) }}>
      {events.length === 0 && addingDay !== key ? (
        <p className="cal-day-empty">No tasks due on this day.</p>
      ) : (
        <>
          {allDay.length > 0 && (
            <div className="cal-day-section">
              <h3 className="cal-day-section-label">All day</h3>
              <div className="cal-day-section-events">
                {allDay.map(t => <EventChip key={t.id} task={t} onClick={onTaskClick} colorBy={colorBy} onContextMenu={(e, task) => onOpenCtxMenu(e, key, task)} onDelete={onDeleteTask} />)}
              </div>
            </div>
          )}
          {timed.length > 0 && (
            <div className="cal-day-section">
              <h3 className="cal-day-section-label">Scheduled</h3>
              {timed.map(t => (
                <div key={t.id} className="cal-timed-row">
                  <span className="cal-timed-label">{fmtTimeStr(t.due_time)}</span>
                  <EventChip task={t} onClick={onTaskClick} colorBy={colorBy} onContextMenu={(e, task) => onOpenCtxMenu(e, key, task)} onDelete={onDeleteTask} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {addingDay === key ? (
        <QuickAddForm
          date={key}
          projectOptions={projectOptions}
          defaultProject={defaultProject}
          onAdd={(date, text, wsId, projectId) => { onQuickAdd(date, text, wsId, projectId); setAddingDay(null) }}
          onCancel={() => setAddingDay(null)}
        />
      ) : (
        projectOptions.length > 0 && (
          <button type="button" className="cal-day-add-task" onClick={() => setAddingDay(key)}>
            <Plus size={13} weight="bold" aria-hidden="true" />
            Add task
          </button>
        )
      )}
    </div>
  )
}

// ── AgendaView ────────────────────────────────────────────────────────────────
function AgendaView({ tasksByDate, onTaskClick, colorBy, onOpenCtxMenu, onDeleteTask }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const allDates = useMemo(() => Object.keys(tasksByDate).sort(), [tasksByDate])

  if (allDates.length === 0) {
    return <p className="cal-day-empty">No tasks with due dates match the current filters.</p>
  }

  return (
    <div className="cal-agenda">
      {allDates.map(dateKey => {
        const events  = tasksByDate[dateKey]
        const d       = dayjs(dateKey)
        const isPast  = dateKey < today
        const isToday = dateKey === today

        return (
          <div
            key={dateKey}
            className={`cal-agenda-row${isPast ? ' cal-agenda-row--past' : ''}`}
            onContextMenu={e => { e.preventDefault(); onOpenCtxMenu(e, dateKey, null) }}
          >
            <div className={`cal-agenda-date${isToday ? ' cal-agenda-date--today' : ''}`}>
              <span className="cal-agenda-dow">{d.format('ddd').toUpperCase()}</span>
              <span className="cal-agenda-day">{d.format('D')}</span>
              <span className="cal-agenda-mon">{d.format('MMM YYYY')}</span>
            </div>
            <div className="cal-agenda-events">
              {events.map(t => (
                <EventChip
                  key={t.id}
                  task={t}
                  onClick={onTaskClick}
                  colorBy={colorBy}
                  onContextMenu={(e, task) => onOpenCtxMenu(e, dateKey, task)}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── CalendarView (main export) ────────────────────────────────────────────────
export default function CalendarView({ tasks, onTaskClick, onQuickAdd, onReschedule, onDeleteTask, projectOptions = [] }) {
  const [calView,      setCalView]      = useState('month')
  const [cursor,       setCursor]       = useState(dayjs())
  const [addingDay,    setAddingDay]    = useState(null)
  const [colorBy,      setColorBy]      = useState('status')
  const [filtersOpen,  setFiltersOpen]  = useState(false)
  const [filters,      setFilters]      = useState({ status: '', priority: '', assignee: '' })
  const [overflowData, setOverflowData] = useState(null)
  const [dragOverDay,  setDragOverDay]  = useState(null)
  const [ctxMenu,      setCtxMenu]      = useState(null) // { x, y, dayKey, task }

  const defaultProject    = projectOptions[0]?.value ?? ''
  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const assignees = useMemo(() => {
    const seen = new Set()
    tasks.forEach(t => { if (t.assignee?.email) seen.add(t.assignee.email) })
    return Array.from(seen)
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (!activeFilterCount) return tasks
    return tasks.filter(t => {
      if (filters.status   && t.status          !== filters.status)   return false
      if (filters.priority && t.priority        !== filters.priority) return false
      if (filters.assignee && t.assignee?.email !== filters.assignee) return false
      return true
    })
  }, [tasks, filters, activeFilterCount])

  const tasksByDate = useMemo(() => {
    const map = {}
    filteredTasks.forEach(t => {
      if (!t.due_date) return
      const key = t.due_date.slice(0, 10)
      ;(map[key] ??= []).push(t)
    })
    return map
  }, [filteredTasks])

  const goBack = () => {
    setAddingDay(null)
    setCursor(c =>
      calView === 'month'  ? c.subtract(1, 'month')
      : calView === 'week' ? c.subtract(1, 'week')
      : c.subtract(1, 'day')
    )
  }
  const goFwd = () => {
    setAddingDay(null)
    setCursor(c =>
      calView === 'month'  ? c.add(1, 'month')
      : calView === 'week' ? c.add(1, 'week')
      : c.add(1, 'day')
    )
  }

  const jumpToDay   = day => { setAddingDay(null); setCursor(day); setCalView('day') }
  const handleMiniDayClick = day => {
    setAddingDay(null)
    setCursor(day)
    if (calView === 'month' || calView === 'agenda') setCalView('day')
  }

  const handleDragEnd = useCallback(() => { setDragOverDay(null) }, [])

  // Context menu open: from a day cell (task=null) or from a chip (task=task)
  const openCtxMenu = useCallback((e, dayKey, task) => {
    e.preventDefault()
    e.stopPropagation()
    setOverflowData(null) // close overflow if open
    setCtxMenu({ x: e.clientX, y: e.clientY, dayKey, task })
  }, [])
  const closeCtxMenu = useCallback(() => setCtxMenu(null), [])

  // "Add task here" from context menu — reuse the inline quick-add form
  const handleCtxAdd = useCallback(dayKey => {
    setAddingDay(dayKey)
    // If month view and date is in current visible month, nothing extra needed.
    // If it's a different view, switch to day view so the form is visible.
    if (calView !== 'month') {
      setCursor(dayjs(dayKey))
      setCalView('day')
    }
  }, [calView])

  const navTitle =
    calView === 'month'  ? cursor.format('MMMM YYYY')
    : calView === 'week'
      ? `${cursor.startOf('week').format('MMM D')} – ${cursor.endOf('week').format('MMM D, YYYY')}`
    : calView === 'agenda' ? 'Agenda'
    : cursor.format('dddd, MMMM D, YYYY')

  const sharedProps = {
    cursor, tasksByDate,
    onTaskClick, onDayClick: jumpToDay,
    addingDay, setAddingDay,
    projectOptions, defaultProject, onQuickAdd,
    colorBy,
    dragOverDay, setDragOverDay,
    onReschedule:  onReschedule  ?? (() => {}),
    onDeleteTask:  onDeleteTask  ?? null,
    onDragStart: () => {},
    onDragEnd:   handleDragEnd,
    onOpenCtxMenu: openCtxMenu,
  }

  return (
    <div className="cal-wrap">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button type="button" className="cal-today-btn" onClick={() => { setAddingDay(null); setCursor(dayjs()) }}>
            Today
          </button>
          <div className="cal-nav-btns">
            <button type="button" className="cal-nav-btn" onClick={goBack} aria-label="Previous">
              <CaretLeft size={14} weight="bold" aria-hidden="true" />
            </button>
            <button type="button" className="cal-nav-btn" onClick={goFwd} aria-label="Next">
              <CaretRight size={14} weight="bold" aria-hidden="true" />
            </button>
          </div>
          <span className="cal-nav-title">{navTitle}</span>
        </div>

        <div className="cal-toolbar-right">
          <div className="cal-color-by" title="Color chips by">
            <button type="button" className={`cal-color-by-btn${colorBy === 'status' ? ' cal-color-by-btn--active' : ''}`} onClick={() => setColorBy('status')}>Status</button>
            <button type="button" className={`cal-color-by-btn${colorBy === 'project' ? ' cal-color-by-btn--active' : ''}`} onClick={() => setColorBy('project')}>Project</button>
          </div>

          <button
            type="button"
            className={`cal-filter-btn${filtersOpen ? ' cal-filter-btn--open' : ''}${activeFilterCount > 0 ? ' cal-filter-btn--active' : ''}`}
            onClick={() => setFiltersOpen(o => !o)}
            aria-expanded={filtersOpen}
            aria-label={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          >
            <Funnel size={13} weight={activeFilterCount > 0 ? 'fill' : 'regular'} aria-hidden="true" />
            {activeFilterCount > 0 && <span className="cal-filter-badge" aria-hidden="true">{activeFilterCount}</span>}
          </button>

          <div className="cal-view-tabs">
            {['day', 'week', 'month', 'agenda'].map(v => (
              <button
                key={v}
                type="button"
                className={`cal-view-tab${calView === v ? ' cal-view-tab--active' : ''}`}
                onClick={() => { setAddingDay(null); setCalView(v) }}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter bar ──────────────────────────────────────── */}
      {filtersOpen && <FilterBar filters={filters} onChange={setFilters} assignees={assignees} />}

      {/* ── Body: mini sidebar + view area ──────────────────── */}
      <div className="cal-body">
        <MiniSidebar mainCursor={cursor} onDayClick={handleMiniDayClick} tasksByDate={tasksByDate} />

        <div className="cal-view-area">
          {calView === 'month'  && <MonthView {...sharedProps} setOverflowData={setOverflowData} />}
          {calView === 'week'   && <WeekView  {...sharedProps} />}
          {calView === 'day'    && <DayView   {...sharedProps} />}
          {calView === 'agenda' && <AgendaView tasksByDate={tasksByDate} onTaskClick={onTaskClick} colorBy={colorBy} onOpenCtxMenu={openCtxMenu} onDeleteTask={onDeleteTask} />}
        </div>
      </div>

      {/* ── Overflow popover ────────────────────────────────── */}
      {overflowData && (
        <OverflowPopover
          triggerRect={overflowData.rect}
          events={tasksByDate[overflowData.dayKey] ?? []}
          onTaskClick={onTaskClick}
          onClose={() => setOverflowData(null)}
          colorBy={colorBy}
          onChipContextMenu={(e, task) => openCtxMenu(e, overflowData.dayKey, task)}
          onDeleteTask={onDeleteTask}
        />
      )}

      {/* ── Context menu ────────────────────────────────────── */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          dayKey={ctxMenu.dayKey}
          task={ctxMenu.task}
          onAddToDay={handleCtxAdd}
          onReschedule={onReschedule ?? (() => {})}
          onDelete={onDeleteTask ?? (() => {})}
          onClose={closeCtxMenu}
        />
      )}
    </div>
  )
}
