import { useMemo, useRef, useState } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { PRIORITIES } from '../../lib/priority'
import { useAuth } from '../../contexts/AuthContext'

dayjs.extend(isoWeek)

const STATUS_META = {
  toDo:       { label: 'To Do',       color: 'var(--ink-3)' },
  inProgress: { label: 'In Progress', color: 'var(--accent)' },
  inReview:   { label: 'In Review',   color: 'var(--amber, #f59e0b)' },
  done:       { label: 'Done',        color: 'var(--green, #22c55e)' },
}

const STATUS_ORDER = ['toDo', 'inProgress', 'inReview', 'done']

function priorityColor(priority) {
  if (!priority) return 'var(--accent)'
  return PRIORITIES?.find?.(p => p.id === priority)?.color ?? 'var(--accent)'
}

export default function GanttView({ tasks = [], columns, onTaskClick }) {
  const RANGE_WEEKS = 6
  const LABEL_W     = 220  // px — left task-label column

  const { prefs } = useAuth()
  const weekStartDay = prefs?.weekStart ?? 1  // 1=Monday, 0=Sunday

  const weekAnchor = () =>
    weekStartDay === 1
      ? dayjs().startOf('isoWeek')
      : dayjs().startOf('week')

  const [cursor, setCursor] = useState(() =>
    weekAnchor().subtract(3, 'week')
  )

  const today     = dayjs().startOf('day')
  const rangeStart = cursor.startOf('day')
  const rangeEnd   = rangeStart.add(RANGE_WEEKS * 7 - 1, 'day')

  // Build the array of days in the range
  const days = useMemo(() => {
    const result = []
    let d = rangeStart
    while (!d.isAfter(rangeEnd)) {
      result.push(d)
      d = d.add(1, 'day')
    }
    return result
  }, [cursor]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalCols = days.length
  const todayIdx  = days.findIndex(d => d.isSame(today, 'day'))

  // Group tasks by status, only tasks with due_date
  const tasksByStatus = useMemo(() => {
    const groups = {}
    STATUS_ORDER.forEach(s => { groups[s] = [] })
    for (const t of tasks) {
      if (!t.due_date) continue
      const s = t.status ?? 'toDo'
      if (groups[s]) groups[s].push(t)
      else groups['toDo'].push(t)
    }
    // Sort each group by due_date ascending
    for (const s of STATUS_ORDER) {
      groups[s].sort((a, b) => a.due_date.localeCompare(b.due_date))
    }
    return groups
  }, [tasks])

  const noDueDateCount = tasks.filter(t => !t.due_date).length
  const hasTasks       = STATUS_ORDER.some(s => tasksByStatus[s].length > 0)

  const navigateWeek = (dir) => {
    setCursor(prev => prev.add(dir, 'week'))
  }

  const snapToday = () => {
    setCursor(weekAnchor().subtract(3, 'week'))
  }

  // Range label: "May 5 – Jun 15, 2026"
  const rangeLabel = `${rangeStart.format('MMM D')} – ${rangeEnd.format('MMM D, YYYY')}`

  const scrollRef = useRef(null)

  return (
    <div className="gantt-wrap">
      {/* ── Toolbar ── */}
      <div className="gantt-toolbar">
        <div className="gantt-toolbar-left">
          <button className="gantt-nav-btn" onClick={() => navigateWeek(-1)} aria-label="Previous week">
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
          </button>
          <button className="gantt-today-btn" onClick={snapToday}>Today</button>
          <button className="gantt-nav-btn" onClick={() => navigateWeek(1)} aria-label="Next week">
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </button>
        </div>
        <span className="gantt-range-label">{rangeLabel}</span>
      </div>

      {/* ── Scrollable grid area ── */}
      <div className="gantt-scroll" ref={scrollRef}>
        <div
          className="gantt-grid"
          style={{ '--gantt-label-w': `${LABEL_W}px`, '--gantt-cols': totalCols }}
        >

          {/* ── Header: month bands + day numbers ── */}
          <div className="gantt-header-label" aria-hidden="true" />
          {days.map((d, i) => {
            const isToday   = i === todayIdx
            const isMonday  = d.day() === 1
            const isSunday  = d.day() === 0
            return (
              <div
                key={d.format('YYYY-MM-DD')}
                className={[
                  'gantt-header-day',
                  isToday   ? 'gantt-header-day--today'   : '',
                  isSunday  ? 'gantt-header-day--weekend'  : '',
                ].filter(Boolean).join(' ')}
              >
                {isMonday && (
                  <span className="gantt-month-tick">{d.format('MMM')}</span>
                )}
                <span className="gantt-day-num">{d.format('D')}</span>
              </div>
            )
          })}

          {/* ── Status groups ── */}
          {STATUS_ORDER.map(status => {
            const groupTasks = tasksByStatus[status]
            const meta       = STATUS_META[status]
            if (groupTasks.length === 0) return null

            return [
              // Status group header row
              <div
                key={`group-label-${status}`}
                className="gantt-group-label"
                style={{ '--group-color': meta.color }}
              >
                <span className="gantt-group-dot" aria-hidden="true" />
                {meta.label}
                <span className="gantt-group-count">{groupTasks.length}</span>
              </div>,
              <div
                key={`group-cols-${status}`}
                className="gantt-group-cols-strip"
                aria-hidden="true"
              >
                {days.map((d, i) => (
                  <div
                    key={i}
                    className={[
                      'gantt-strip-cell',
                      i === todayIdx      ? 'gantt-strip-cell--today'   : '',
                      d.day() === 0 || d.day() === 6 ? 'gantt-strip-cell--weekend' : '',
                    ].filter(Boolean).join(' ')}
                  />
                ))}
              </div>,

              // Task rows
              ...groupTasks.map(task => {
                const dueDayIdx = days.findIndex(d => d.isSame(dayjs(task.due_date), 'day'))
                const isInRange = dueDayIdx !== -1
                const isOverdue = task.status !== 'done' && dayjs(task.due_date).isBefore(today)
                const pColor    = priorityColor(task.priority)

                return [
                  <div
                    key={`row-label-${task.id}`}
                    className="gantt-row-label"
                    onClick={() => onTaskClick(task.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onTaskClick(task.id) }}
                    aria-label={`Open task: ${task.text}`}
                  >
                    <span
                      className="gantt-row-priority"
                      style={{ background: pColor }}
                      aria-hidden="true"
                    />
                    <span className="gantt-row-text">{task.text}</span>
                    {isOverdue && <span className="gantt-overdue-dot" aria-label="Overdue" />}
                  </div>,
                  <div
                    key={`row-cells-${task.id}`}
                    className="gantt-row-cells"
                  >
                    {days.map((d, i) => {
                      const isTaskDay = i === dueDayIdx
                      const isToday   = i === todayIdx
                      const isWeekend = d.day() === 0 || d.day() === 6
                      return (
                        <div
                          key={i}
                          className={[
                            'gantt-cell',
                            isToday   ? 'gantt-cell--today'   : '',
                            isWeekend ? 'gantt-cell--weekend' : '',
                          ].filter(Boolean).join(' ')}
                        >
                          {isTaskDay && isInRange && (
                            <button
                              className={`gantt-pill${isOverdue ? ' gantt-pill--overdue' : ''}`}
                              style={{ '--pill-color': pColor }}
                              onClick={() => onTaskClick(task.id)}
                              aria-label={`${task.text} — due ${dayjs(task.due_date).format('MMM D')}`}
                              title={`${task.text} — due ${dayjs(task.due_date).format('MMM D, YYYY')}`}
                            >
                              <span className="gantt-pill-text">{task.text}</span>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>,
                ]
              }),
            ]
          })}

          {/* Out-of-range pills: tasks with due_date outside visible window */}
        </div>

        {/* Out-of-range markers */}
        {tasks.filter(t => t.due_date && (
          dayjs(t.due_date).isBefore(rangeStart) || dayjs(t.due_date).isAfter(rangeEnd)
        )).length > 0 && (
          <p className="gantt-out-of-range">
            {tasks.filter(t => t.due_date && (
              dayjs(t.due_date).isBefore(rangeStart) || dayjs(t.due_date).isAfter(rangeEnd)
            )).length} task{tasks.filter(t => t.due_date && (
              dayjs(t.due_date).isBefore(rangeStart) || dayjs(t.due_date).isAfter(rangeEnd)
            )).length !== 1 ? 's' : ''} outside visible range — use ← → to navigate
          </p>
        )}
      </div>

      {/* ── Footer ── */}
      {(noDueDateCount > 0 || !hasTasks) && (
        <div className="gantt-footer">
          {!hasTasks && noDueDateCount === 0 && (
            <span>No tasks yet. Add tasks with due dates to see them here.</span>
          )}
          {noDueDateCount > 0 && (
            <span>{noDueDateCount} task{noDueDateCount !== 1 ? 's' : ''} without a due date {noDueDateCount !== 1 ? 'are' : 'is'} not shown.</span>
          )}
        </div>
      )}
    </div>
  )
}
