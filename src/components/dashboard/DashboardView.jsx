import dayjs from 'dayjs'
import { useDashboard } from '../../hooks/useDashboard'

const HEATMAP_LEVELS = [
  { min: 0, cls: 'hm-0' },
  { min: 1, cls: 'hm-1' },
  { min: 3, cls: 'hm-2' },
  { min: 6, cls: 'hm-3' },
  { min: 10, cls: 'hm-4' },
]

function heatLevel(count) {
  let cls = 'hm-0'
  for (const l of HEATMAP_LEVELS) {
    if (count >= l.min) cls = l.cls
  }
  return cls
}

const STATUS_META = [
  { id: 'toDo',       label: 'To Do',       cls: 'sb-todo' },
  { id: 'inProgress', label: 'In Progress',  cls: 'sb-progress' },
  { id: 'inReview',   label: 'In Review',    cls: 'sb-review' },
  { id: 'done',       label: 'Done',         cls: 'sb-done' },
]

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`dash-stat-card${highlight ? ' dash-stat-card--highlight' : ''}`}>
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-label">{label}</span>
      {sub && <span className="dash-stat-sub">{sub}</span>}
    </div>
  )
}

function Heatmap({ cells }) {
  if (!cells?.length) return null

  // Build month label positions: track when month changes across the columns
  const monthLabels = []
  let prevMonth = null
  let colIndex  = 0
  let dayInCol  = 0

  for (let i = 0; i < cells.length; i++) {
    const month = dayjs(cells[i].date).month()
    if (month !== prevMonth) {
      monthLabels.push({ col: colIndex + 1, label: dayjs(cells[i].date).format('MMM') })
      prevMonth = month
    }
    dayInCol++
    if (dayInCol === 7) { colIndex++; dayInCol = 0 }
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-month-row">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="heatmap-month-label"
            style={{ gridColumnStart: m.col }}
          >
            {m.label}
          </span>
        ))}
      </div>
      <div className="heatmap-grid">
        {cells.map(cell => (
          <div
            key={cell.date}
            className={`hm-cell ${heatLevel(cell.count)}`}
            title={`${cell.date}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
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
        {STATUS_META.map(s => {
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
        {STATUS_META.map(s => (
          <div key={s.id} className="sb-legend-item">
            <span className={`sb-dot ${s.cls}`} />
            <span className="sb-legend-label">{s.label}</span>
            <span className="sb-legend-count">{breakdown[s.id]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecentCompletions({ items }) {
  if (!items?.length) return <p className="dash-empty">No completed tasks yet.</p>
  return (
    <ul className="recent-list">
      {items.map(t => (
        <li key={t.id} className="recent-item">
          <span className="recent-check" aria-hidden="true">✓</span>
          <span className="recent-text">{t.text}</span>
          <span className="recent-date">
            {t.completed_at
              ? dayjs(t.completed_at).format('MMM D')
              : '—'
            }
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function DashboardView({ workspaceId }) {
  const { data, loading, error } = useDashboard(workspaceId)

  if (loading) return (
    <div className="dash-loading">
      <div className="dash-skeleton" />
      <div className="dash-skeleton dash-skeleton--wide" />
      <div className="dash-skeleton" />
    </div>
  )

  if (error) return <p className="dash-error">Failed to load dashboard: {error}</p>

  if (!data) return null

  const { stats, streak, heatmap, statusBreakdown, recentCompletions } = data
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.totalCompleted / stats.totalTasks) * 100)
    : 0

  return (
    <div className="dashboard">

      {/* ── Streak + Stats ─────────────────────────────── */}
      <div className="dash-top-row">
        <div className="dash-streak-card">
          <div className="streak-flame" aria-hidden="true">🔥</div>
          <div className="streak-body">
            <div className="streak-current">
              <span className="streak-number">{streak.current}</span>
              <span className="streak-unit">day{streak.current !== 1 ? 's' : ''}</span>
            </div>
            <p className="streak-label">Current streak</p>
            <p className="streak-best">Best: {streak.longest} day{streak.longest !== 1 ? 's' : ''}</p>
          </div>
          {streak.current === 0 && (
            <p className="streak-nudge">Complete a task today to start your streak!</p>
          )}
        </div>

        <div className="dash-stats-grid">
          <StatCard label="Completed today"      value={stats.completedToday}     />
          <StatCard label="This week"            value={stats.completedThisWeek}  />
          <StatCard label="This month"           value={stats.completedThisMonth} />
          <StatCard label="Overdue"              value={stats.overdue}            highlight={stats.overdue > 0} />
          <StatCard label="Total completed"      value={stats.totalCompleted}     sub={`${completionRate}% done`} />
          <StatCard label="Total tasks"          value={stats.totalTasks}         />
        </div>
      </div>

      {/* ── Activity heatmap ───────────────────────────── */}
      <section className="dash-section">
        <h2 className="dash-section-title">Activity — last 12 months</h2>
        <Heatmap cells={heatmap} />
      </section>

      {/* ── Bottom row ─────────────────────────────────── */}
      <div className="dash-bottom-row">
        <section className="dash-section dash-section--half">
          <h2 className="dash-section-title">Task breakdown</h2>
          <StatusBreakdown breakdown={statusBreakdown} total={stats.totalTasks} />
        </section>

        <section className="dash-section dash-section--half">
          <h2 className="dash-section-title">Recently completed</h2>
          <RecentCompletions items={recentCompletions} />
        </section>
      </div>
    </div>
  )
}
