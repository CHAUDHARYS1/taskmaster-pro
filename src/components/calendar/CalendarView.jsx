import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUS_STYLE = {
  toDo:       { color: 'var(--ink-3)',  bg: 'var(--paper-3)' },
  inProgress: { color: 'var(--accent)', bg: 'var(--accent-muted, rgba(37,99,235,0.1))' },
  inReview:   { color: 'var(--amber)',  bg: 'rgba(245,158,11,0.12)' },
  done:       { color: 'var(--green)',  bg: 'rgba(34,197,94,0.12)' },
}

function EventChip({ task, onClick }) {
  const s = STATUS_STYLE[task.status] ?? STATUS_STYLE.toDo
  return (
    <button
      type="button"
      className={`cal-event${task.status === 'done' ? ' cal-event--done' : ''}`}
      style={{ '--ev-color': s.color, '--ev-bg': s.bg }}
      onClick={e => { e.stopPropagation(); onClick(task) }}
      title={task.text}
    >
      {task.due_time && (
        <span className="cal-event-time">
          {dayjs(`2000-01-01T${task.due_time}`).format('h:mma')}
        </span>
      )}
      <span className="cal-event-text">{task.text}</span>
    </button>
  )
}

function MonthView({ cursor, tasksByDate, onTaskClick, onDayClick }) {
  const today     = dayjs().format('YYYY-MM-DD')
  const gridStart = cursor.startOf('month').startOf('week')
  const cells     = Array.from({ length: 42 }, (_, i) => gridStart.add(i, 'day'))

  return (
    <div className="cal-month">
      <div className="cal-dow-row">
        {DOW.map(d => <div key={d} className="cal-dow-cell">{d}</div>)}
      </div>
      <div className="cal-month-grid">
        {cells.map(day => {
          const key     = day.format('YYYY-MM-DD')
          const events  = tasksByDate[key] ?? []
          const isToday = key === today
          const isOther = day.month() !== cursor.month()
          const visible = events.slice(0, 3)
          const overflow = events.length - 3

          return (
            <div
              key={key}
              className={`cal-day${isToday ? ' cal-day--today' : ''}${isOther ? ' cal-day--other' : ''}`}
              onClick={() => onDayClick(day)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onDayClick(day)}
              aria-label={`${day.format('MMMM D')}, ${events.length} task${events.length !== 1 ? 's' : ''}`}
            >
              <span className="cal-day-num">{day.date()}</span>
              <div className="cal-day-events">
                {visible.map(t => <EventChip key={t.id} task={t} onClick={onTaskClick} />)}
                {overflow > 0 && (
                  <button
                    type="button"
                    className="cal-overflow"
                    onClick={e => { e.stopPropagation(); onDayClick(day) }}
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function WeekView({ cursor, tasksByDate, onTaskClick, onDayClick }) {
  const today = dayjs().format('YYYY-MM-DD')
  const days  = Array.from({ length: 7 }, (_, i) => cursor.startOf('week').add(i, 'day'))

  return (
    <div className="cal-week">
      {days.map(day => {
        const key     = day.format('YYYY-MM-DD')
        const events  = tasksByDate[key] ?? []
        const isToday = key === today

        return (
          <div key={key} className={`cal-week-col${isToday ? ' cal-week-col--today' : ''}`}>
            <button type="button" className="cal-week-hdr" onClick={() => onDayClick(day)}>
              <span className="cal-week-dow">{DOW[day.day()]}</span>
              <span className={`cal-week-date${isToday ? ' cal-week-date--today' : ''}`}>
                {day.date()}
              </span>
            </button>
            <div className="cal-week-events">
              {events.map(t => <EventChip key={t.id} task={t} onClick={onTaskClick} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DayView({ cursor, tasksByDate, onTaskClick }) {
  const key    = cursor.format('YYYY-MM-DD')
  const events = tasksByDate[key] ?? []
  const allDay = events.filter(t => !t.due_time)
  const timed  = events.filter(t => t.due_time).sort((a, b) => (a.due_time < b.due_time ? -1 : 1))

  if (events.length === 0) {
    return (
      <div className="cal-day-view">
        <p className="cal-day-empty">No tasks due on this day.</p>
      </div>
    )
  }

  return (
    <div className="cal-day-view">
      {allDay.length > 0 && (
        <div className="cal-day-section">
          <h3 className="cal-day-section-label">All day</h3>
          <div className="cal-day-section-events">
            {allDay.map(t => <EventChip key={t.id} task={t} onClick={onTaskClick} />)}
          </div>
        </div>
      )}
      {timed.length > 0 && (
        <div className="cal-day-section">
          <h3 className="cal-day-section-label">Scheduled</h3>
          {timed.map(t => (
            <div key={t.id} className="cal-timed-row">
              <span className="cal-timed-label">
                {dayjs(`2000-01-01T${t.due_time}`).format('h:mm a')}
              </span>
              <EventChip task={t} onClick={onTaskClick} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CalendarView({ tasks, onTaskClick }) {
  const [calView, setCalView] = useState('month')
  const [cursor,  setCursor]  = useState(dayjs())

  const tasksByDate = useMemo(() => {
    const map = {}
    tasks.forEach(t => {
      if (!t.due_date) return
      const key = t.due_date.slice(0, 10)
      ;(map[key] ??= []).push(t)
    })
    return map
  }, [tasks])

  const goBack = () => setCursor(c =>
    calView === 'month' ? c.subtract(1, 'month')
    : calView === 'week' ? c.subtract(1, 'week')
    : c.subtract(1, 'day')
  )
  const goFwd = () => setCursor(c =>
    calView === 'month' ? c.add(1, 'month')
    : calView === 'week' ? c.add(1, 'week')
    : c.add(1, 'day')
  )
  const jumpToDay = day => { setCursor(day); setCalView('day') }

  const navTitle =
    calView === 'month' ? cursor.format('MMMM YYYY')
    : calView === 'week' ? `${cursor.startOf('week').format('MMM D')} – ${cursor.endOf('week').format('MMM D, YYYY')}`
    : cursor.format('dddd, MMMM D, YYYY')

  return (
    <div className="cal-wrap">
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button type="button" className="cal-today-btn" onClick={() => setCursor(dayjs())}>
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
        <div className="cal-view-tabs">
          {['day', 'week', 'month'].map(v => (
            <button
              key={v}
              type="button"
              className={`cal-view-tab${calView === v ? ' cal-view-tab--active' : ''}`}
              onClick={() => setCalView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {calView === 'month' && (
        <MonthView cursor={cursor} tasksByDate={tasksByDate} onTaskClick={onTaskClick} onDayClick={jumpToDay} />
      )}
      {calView === 'week' && (
        <WeekView cursor={cursor} tasksByDate={tasksByDate} onTaskClick={onTaskClick} onDayClick={jumpToDay} />
      )}
      {calView === 'day' && (
        <DayView cursor={cursor} tasksByDate={tasksByDate} onTaskClick={onTaskClick} />
      )}
    </div>
  )
}
