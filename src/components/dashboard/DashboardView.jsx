import { useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {
  Fire, CheckCircle, Warning, TrendUp, Clock,
  ListChecks, ChartBar, CalendarDots,
} from '@phosphor-icons/react'
import { useDashboard } from '../../hooks/useDashboard'

dayjs.extend(relativeTime)

/* ─── constants ─────────────────────────────────────────────── */

const CURRENT_YEAR   = dayjs().year()
const AVAILABLE_YEARS = Array.from(
  { length: CURRENT_YEAR - 2024 + 1 },
  (_, i) => 2025 + i,
)

const HEATMAP_LEVELS = [
  { min: 0,  cls: 'hm-0' },
  { min: 1,  cls: 'hm-1' },
  { min: 3,  cls: 'hm-2' },
  { min: 6,  cls: 'hm-3' },
  { min: 10, cls: 'hm-4' },
]

const STATUS_META = [
  { id: 'toDo',       label: 'To Do',       cls: 'sb-todo' },
  { id: 'inProgress', label: 'In Progress',  cls: 'sb-progress' },
  { id: 'inReview',   label: 'In Review',    cls: 'sb-review' },
  { id: 'done',       label: 'Done',         cls: 'sb-done' },
]

const PRIORITY_META = [
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
  { id: 'high',   label: 'High',   color: '#f59e0b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'low',    label: 'Low',    color: '#6b7280' },
  { id: 'none',   label: 'None',   color: '#d1d5db' },
]

/* ─── helpers ────────────────────────────────────────────────── */

function heatLevel(count) {
  let cls = 'hm-0'
  for (const l of HEATMAP_LEVELS) { if (count >= l.min) cls = l.cls }
  return cls
}

function dueDateLabel(dateStr) {
  const d     = dayjs(dateStr)
  const today = dayjs().startOf('day')
  const diff  = d.diff(today, 'day')
  if (diff === 0) return { text: 'Today',     urgent: true  }
  if (diff === 1) return { text: 'Tomorrow',  urgent: true  }
  return { text: `In ${diff}d`, urgent: false }
}

const PRIORITY_COLORS = {
  urgent: '#ef4444',
  high:   '#f59e0b',
  medium: '#3b82f6',
  low:    '#6b7280',
}

/* ─── sub-components ─────────────────────────────────────────── */

function StatCard({ icon: Icon, value, label, color, delay, alert }) {
  return (
    <div
      className={`dash-stat-card${alert ? ' dash-stat-card--alert' : ''}`}
      style={{ animationDelay: delay }}
    >
      <div className="dash-stat-card-icon" style={{ color }}>
        <Icon size={20} weight="duotone" aria-hidden="true" />
      </div>
      <div className="dash-stat-card-body">
        <span className="dash-stat-card-value" style={alert ? { color: 'var(--red)' } : {}}>
          {value}
        </span>
        <span className="dash-stat-card-label">{label}</span>
      </div>
    </div>
  )
}

function Heatmap({ cells }) {
  if (!cells?.length) return null

  const monthLabels = []
  let prevMonth = null
  let colIndex  = 0
  let dayInCol  = 0

  for (let i = 0; i < cells.length; i++) {
    const cell  = cells[i]
    const month = dayjs(cell.date).month()
    if (!cell.faded && month !== prevMonth) {
      monthLabels.push({ col: colIndex + 1, label: dayjs(cell.date).format('MMM') })
      prevMonth = month
    }
    dayInCol++
    if (dayInCol === 7) { colIndex++; dayInCol = 0 }
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-month-row">
        {monthLabels.map((m, i) => (
          <span key={i} className="heatmap-month-label" style={{ gridColumnStart: m.col }}>
            {m.label}
          </span>
        ))}
      </div>
      <div className="heatmap-grid">
        {cells.map(cell => (
          <div
            key={cell.date}
            className={`hm-cell ${cell.faded ? 'hm-faded' : heatLevel(cell.count)}`}
            title={cell.faded ? undefined : `${cell.date}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
          />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        {['hm-0','hm-1','hm-2','hm-3','hm-4'].map(c => (
          <div key={c} className={`hm-cell ${c}`} />
        ))}
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  )
}

function StatusBreakdown({ breakdown, total }) {
  if (!total) return <p className="dash-empty">No tasks yet.</p>
  return (
    <div className="status-breakdown">
      <div className="sb-bar-track">
        {[...STATUS_META].reverse().map(s => {
          const pct = total > 0 ? (breakdown[s.id] / total) * 100 : 0
          return pct > 0 ? (
            <div
              key={s.id}
              className={`sb-bar-seg ${s.cls}`}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${breakdown[s.id]}`}
            />
          ) : null
        })}
      </div>
      <div className="sb-legend">
        {STATUS_META.map(s => {
          const pct = total > 0 ? Math.round((breakdown[s.id] / total) * 100) : 0
          return (
            <div key={s.id} className="sb-legend-item">
              <span className={`sb-dot ${s.cls}`} />
              <span className="sb-legend-label">{s.label}</span>
              <span className="sb-legend-count">{breakdown[s.id]}</span>
              <span className="sb-legend-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriorityBreakdown({ breakdown }) {
  const activeTotal = Object.values(breakdown).reduce((a, b) => a + b, 0)
  if (!activeTotal) return <p className="dash-empty">No active tasks.</p>

  return (
    <div className="priority-breakdown">
      <div className="sb-bar-track">
        {PRIORITY_META.map(p => {
          const count = breakdown[p.id] ?? 0
          const pct   = activeTotal > 0 ? (count / activeTotal) * 100 : 0
          return pct > 0 ? (
            <div
              key={p.id}
              className="sb-bar-seg"
              style={{ width: `${pct}%`, background: p.color }}
              title={`${p.label}: ${count}`}
            />
          ) : null
        })}
      </div>
      <div className="sb-legend">
        {PRIORITY_META.filter(p => (breakdown[p.id] ?? 0) > 0).map(p => {
          const count = breakdown[p.id]
          const pct   = Math.round((count / activeTotal) * 100)
          return (
            <div key={p.id} className="sb-legend-item">
              <span className="sb-dot" style={{ background: p.color }} />
              <span className="sb-legend-label">{p.label}</span>
              <span className="sb-legend-count">{count}</span>
              <span className="sb-legend-pct">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DueSoon({ items }) {
  if (!items?.length) return <p className="dash-empty">Nothing due in the next 7 days.</p>
  return (
    <ul className="due-soon-list">
      {items.map((t, i) => {
        const { text: dlabel, urgent } = dueDateLabel(t.due_date)
        const priColor = PRIORITY_COLORS[t.priority] ?? null
        return (
          <li key={t.id} className="due-soon-item" style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
            {priColor && (
              <span className="due-soon-pri-dot" style={{ background: priColor }} aria-hidden="true" />
            )}
            <span className="due-soon-text">{t.text}</span>
            <span className={`due-soon-date${urgent ? ' due-soon-date--urgent' : ''}`}>
              {dlabel}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

const VELOCITY_BAR_MAX_PX = 88

function VelocityChart({ weeks }) {
  if (!weeks?.length) return null
  const max = Math.max(...weeks.map(w => w.count), 1)

  return (
    <div className="velocity-chart">
      {weeks.map((w, i) => {
        const barPx    = w.count > 0 ? Math.max(Math.round((w.count / max) * VELOCITY_BAR_MAX_PX), 4) : 0
        const isRecent = i >= 6
        return (
          <div key={w.weekStart} className="velocity-col" title={`${w.label}: ${w.count} completed`}>
            <span className="velocity-count">{w.count > 0 ? w.count : ''}</span>
            <div
              className={`velocity-bar${isRecent ? ' velocity-bar--recent' : ''}`}
              style={{ height: barPx }}
            />
            <span className="velocity-label">{w.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function RecentCompletions({ items }) {
  if (!items?.length) return <p className="dash-empty">No completed tasks yet.</p>
  return (
    <ul className="recent-list">
      {items.map((t, i) => {
        const priColor = PRIORITY_COLORS[t.priority] ?? null
        return (
          <li key={t.id} className="recent-item" style={{ animationDelay: `${0.15 + i * 0.04}s` }}>
            <span className="recent-check-dot" style={priColor ? { background: priColor } : {}} aria-hidden="true" />
            <span className="recent-text">{t.text}</span>
            <span className="recent-date">
              {t.completed_at ? dayjs(t.completed_at).format('MMM D') : '—'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/* ─── main component ─────────────────────────────────────────── */

export default function DashboardView() {
  const [heatmapYear, setHeatmapYear] = useState(CURRENT_YEAR)
  const { data, loading, error } = useDashboard(heatmapYear)

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-skeleton dash-skeleton--header" />
      <div className="dash-skeleton dash-skeleton--rail" />
      <div className="dash-skeleton dash-skeleton--wide" />
      <div className="dash-skeleton" />
    </div>
  )

  if (error) return <p className="dash-error">Failed to load dashboard: {error}</p>
  if (!data)  return null

  const { stats, streak, heatmap, statusBreakdown, priorityBreakdown,
          recentCompletions, dueSoon, weeklyVelocity } = data

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.totalCompleted / stats.totalTasks) * 100)
    : 0

  return (
    <div className="dashboard">

      {/* ── Header ───────────────────────────────────── */}
      <header className="dash-header">
        <div className="dash-header-date">
          <span className="dash-header-day">{dayjs().format('dddd')}</span>
          <span className="dash-header-full">{dayjs().format('MMMM D, YYYY')}</span>
        </div>
        {streak.current > 0 && (
          <div className="dash-streak-badge">
            <Fire size={14} weight="fill" className="dash-streak-icon" aria-hidden="true" />
            <span className="dash-streak-num">{streak.current}</span>
            <span className="dash-streak-label">day streak</span>
            {streak.longest > streak.current && (
              <span className="dash-streak-best">best: {streak.longest}</span>
            )}
          </div>
        )}
      </header>

      {/* ── Stat cards ───────────────────────────────── */}
      <div className="dash-stat-cards">
        <StatCard
          icon={ListChecks}
          value={stats.activeTasks}
          label="Active tasks"
          color="var(--accent)"
          delay="0.05s"
        />
        <StatCard
          icon={CheckCircle}
          value={stats.completedThisWeek}
          label="Done this week"
          color="var(--green)"
          delay="0.10s"
        />
        <StatCard
          icon={Clock}
          value={stats.completedToday}
          label="Done today"
          color="#8b5cf6"
          delay="0.15s"
        />
        <StatCard
          icon={Warning}
          value={stats.overdue}
          label="Overdue"
          color={stats.overdue > 0 ? 'var(--red)' : 'var(--ink-4)'}
          alert={stats.overdue > 0}
          delay="0.20s"
        />
        <StatCard
          icon={TrendUp}
          value={`${completionRate}%`}
          label="Completion rate"
          color={completionRate >= 80 ? 'var(--green)' : 'var(--accent)'}
          delay="0.25s"
        />
        <StatCard
          icon={ChartBar}
          value={stats.totalTasks}
          label="Total tasks"
          color="var(--ink-3)"
          delay="0.30s"
        />
      </div>

      {/* ── Mid row: breakdown + due soon ────────────── */}
      <div className="dash-mid-grid">
        <section className="dash-section" style={{ animationDelay: '0.18s' }}>
          <h2 className="dash-section-title">
            <ListChecks size={14} aria-hidden="true" />
            Status breakdown
          </h2>
          <StatusBreakdown breakdown={statusBreakdown} total={stats.totalTasks} />
        </section>

        <section className="dash-section" style={{ animationDelay: '0.22s' }}>
          <h2 className="dash-section-title">
            <ChartBar size={14} aria-hidden="true" />
            Priority (active tasks)
          </h2>
          <PriorityBreakdown breakdown={priorityBreakdown} />
        </section>

        <section className="dash-section" style={{ animationDelay: '0.26s' }}>
          <h2 className="dash-section-title">
            <CalendarDots size={14} aria-hidden="true" />
            Due in 7 days
            {dueSoon.length > 0 && (
              <span className="dash-due-badge">{dueSoon.length}</span>
            )}
          </h2>
          <DueSoon items={dueSoon} />
        </section>
      </div>

      {/* ── Velocity ─────────────────────────────────── */}
      <section className="dash-section dash-section--velocity" style={{ animationDelay: '0.30s' }}>
        <div className="dash-section-hdr">
          <h2 className="dash-section-title">
            <TrendUp size={14} aria-hidden="true" />
            Weekly velocity
            <span className="dash-section-title-sub">tasks completed per week</span>
          </h2>
          <div className="velocity-summary">
            <span className="velocity-summary-num">{weeklyVelocity[7]?.count ?? 0}</span>
            <span className="velocity-summary-label">this week</span>
            {(() => {
              const thisWk = weeklyVelocity[7]?.count ?? 0
              const lastWk = weeklyVelocity[6]?.count ?? 0
              const delta  = thisWk - lastWk
              if (delta === 0) return null
              return (
                <span className={`velocity-delta${delta > 0 ? ' velocity-delta--up' : ' velocity-delta--down'}`}>
                  {delta > 0 ? '+' : ''}{delta} vs last wk
                </span>
              )
            })()}
          </div>
        </div>
        <VelocityChart weeks={weeklyVelocity} />
      </section>

      {/* ── Activity heatmap ─────────────────────────── */}
      <section className="dash-section dash-section--heatmap" style={{ animationDelay: '0.35s' }}>
        <div className="dash-section-hdr">
          <h2 className="dash-section-title">
            Activity
            <span className="dash-section-title-year">{heatmapYear}</span>
          </h2>
          <select
            className="heatmap-year-select"
            value={heatmapYear}
            onChange={e => setHeatmapYear(Number(e.target.value))}
            aria-label="Select year"
          >
            {AVAILABLE_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <Heatmap cells={heatmap} />
      </section>

      {/* ── Bottom: recent completions ────────────────── */}
      <section className="dash-section" style={{ animationDelay: '0.40s' }}>
        <h2 className="dash-section-title">
          <CheckCircle size={14} aria-hidden="true" />
          Recently completed
        </h2>
        <RecentCompletions items={recentCompletions} />
      </section>

    </div>
  )
}
