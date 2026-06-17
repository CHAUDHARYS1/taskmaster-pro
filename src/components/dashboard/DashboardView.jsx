import { useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  ListChecks, ChartDonut, WarningCircle, CheckCircle, CalendarCheck,
  TrendUp, CalendarDots, CheckFat, Flag, Stack, ClockCountdown,
} from '@phosphor-icons/react'
import { useDashboard } from '../../hooks/useDashboard'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

dayjs.extend(isoWeek)

/* ─── constants ─────────────────────────────────────────────── */

const CURRENT_YEAR    = dayjs().year()
const AVAILABLE_YEARS = Array.from({ length: CURRENT_YEAR - 2024 + 1 }, (_, i) => 2025 + i)

const STATUS_META = [
  { id: 'toDo',       label: 'To Do',      color: 'var(--ink-3)' },
  { id: 'inProgress', label: 'In Progress', color: 'var(--hue-amber, #d97706)' },
  { id: 'inReview',   label: 'In Review',   color: 'var(--hue-sky, #0ea5e9)' },
  { id: 'done',       label: 'Done',        color: 'var(--green)' },
]

const PRIORITY_META = [
  { id: 'urgent', label: 'Urgent', color: '#ef4444' },
  { id: 'high',   label: 'High',   color: '#f59e0b' },
  { id: 'medium', label: 'Medium', color: '#3b82f6' },
  { id: 'low',    label: 'Low',    color: '#6b7280' },
  { id: 'none',   label: 'None',   color: '#d1d5db' },
]

const WS_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
]

/* ─── helpers ────────────────────────────────────────────────── */

function timeGreeting() {
  const h = dayjs().hour()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function dueDateState(dateStr) {
  const d     = dayjs(dateStr)
  const today = dayjs().startOf('day')
  const diff  = d.diff(today, 'day')
  if (diff < 0)  return { text: `Overdue ${Math.abs(diff)}d`, cls: 'over' }
  if (diff === 0) return { text: 'Today',    cls: 'soon' }
  if (diff === 1) return { text: 'Tomorrow', cls: 'soon' }
  if (diff <= 7)  return { text: `In ${diff}d`, cls: 'later' }
  return { text: `In ${diff}d`, cls: 'later' }
}

function heatLevel(count) {
  if (count === 0) return ''
  if (count < 3)  return 'l1'
  if (count < 6)  return 'l2'
  if (count < 10) return 'l3'
  return 'l4'
}

function wsInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}

/* ─── sub-components ─────────────────────────────────────────── */

function KpiTile({ icon: Icon, iconBg, iconColor, value, label, sub, delta, deltaDir }) {
  return (
    <div className="dash-card kpi col-3">
      <div className="kpi-top">
        <span className="kpi-ico" style={{ background: iconBg, color: iconColor }}>
          <Icon size={18} weight="duotone" aria-hidden="true" />
        </span>
        {delta != null && (
          <span className={`kpi-delta ${deltaDir ?? 'flat'}`}>
            {deltaDir === 'up' ? '↑' : deltaDir === 'down' ? '↓' : '·'} {delta}
          </span>
        )}
      </div>
      <div className="kpi-n">{value}</div>
      <div className="kpi-l">{label}{sub ? <> · <b>{sub}</b></> : null}</div>
    </div>
  )
}

function ProgressCard({ statusBreakdown, total, completionRate }) {
  if (!total) return (
    <div className="dash-card col-7">
      <div className="dash-card-h">
        <span className="dash-card-title"><ChartDonut size={14} aria-hidden="true" />Progress &amp; status</span>
      </div>
      <p style={{ color: 'var(--ink-4)', fontSize: 'var(--text-sm)' }}>No tasks yet.</p>
    </div>
  )

  return (
    <div className="dash-card col-7">
      <div className="dash-card-h">
        <span className="dash-card-title"><ChartDonut size={14} aria-hidden="true" />Progress &amp; status</span>
      </div>
      <div className="dash-progress">
        <div className="dash-progress-bar">
          <div className="status-bar">
            {STATUS_META.map(s => {
              const n = statusBreakdown[s.id] ?? 0
              return n > 0 ? (
                <i key={s.id} style={{ background: s.color, width: `${(n / total) * 100}%` }} />
              ) : null
            })}
          </div>
        </div>
        <div className="dash-progress-body">
          <div className="ring" style={{ '--p': completionRate }}>
            <div className="ring-inner">
              <div className="ring-n">{completionRate}%</div>
              <div className="ring-l">Complete</div>
            </div>
          </div>
          <div className="status-rows">
            {STATUS_META.map(s => {
              const n = statusBreakdown[s.id] ?? 0
              const pct = total > 0 ? Math.round((n / total) * 100) : 0
              return (
                <div key={s.id} className="status-row">
                  <span className="status-dot" style={{ background: s.color }} />
                  <span className="status-name">{s.label}</span>
                  <span className="status-n">{n}</span>
                  <span className="status-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function DueSoonCard({ items }) {
  return (
    <div className="dash-card col-5">
      <div className="dash-card-h">
        <span className="dash-card-title">
          <WarningCircle size={14} aria-hidden="true" />
          Due soon
          {items.length > 0 && <span className="dash-pillcount">{items.length}</span>}
        </span>
      </div>
      {!items.length
        ? <p style={{ color: 'var(--ink-4)', fontSize: 'var(--text-sm)' }}>Nothing due in the next 7 days.</p>
        : (
          <div className="due-list">
            {items.map(t => {
              const { text: whenText, cls } = dueDateState(t.due_date)
              const wsColor = t.workspace?.color ?? 'var(--accent)'
              return (
                <div key={t.id} className="due-row" style={{ '--c': cls === 'over' ? 'var(--red)' : cls === 'soon' ? 'var(--amber)' : 'var(--line)' }}>
                  <div className="due-main">
                    <div className="due-t">{t.text}</div>
                    {t.workspace && (
                      <div className="due-meta">
                        <span className="due-ws">
                          <span className="ws-dot" style={{ background: wsColor }} />
                          {t.workspace.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`due-when ${cls}`}>{whenText}</span>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

function VelocityCard({ weeks, thisWeekCount, lastWeekCount }) {
  const max = Math.max(...(weeks ?? []).map(w => w.count), 1)
  const delta = thisWeekCount - lastWeekCount

  return (
    <div className="dash-card col-7">
      <div className="dash-card-h">
        <span className="dash-card-title"><TrendUp size={14} aria-hidden="true" />Weekly velocity</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)', marginTop: 'calc(var(--space-5) * -1 + 2px)', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.03em' }}>
          {thisWeekCount}
        </span>
        <span style={{ fontSize: 'var(--text-body)', color: 'var(--ink-3)' }}>completed this week</span>
        {delta !== 0 && (
          <span className={`kpi-delta ${delta > 0 ? 'up' : 'down'}`} style={{ marginLeft: 'auto' }}>
            {delta > 0 ? '↑' : '↓'} {delta > 0 ? '+' : ''}{delta} vs last wk
          </span>
        )}
      </div>
      <div className="vel">
        {(weeks ?? []).map((w, i) => {
          const isOn   = i === (weeks.length - 1)
          const isPrev = i === (weeks.length - 2)
          const pct    = max > 0 ? (w.count / max) * 100 : 0
          return (
            <div key={w.weekStart} className="vel-col" title={`${w.label}: ${w.count} completed`}>
              <div
                className={`vel-bar${isOn ? ' on' : isPrev ? ' prev' : ''}`}
                style={{ height: `${Math.max(pct, w.count > 0 ? 4 : 0)}%` }}
              >
                {w.count > 0 && <span className="vel-val">{w.count}</span>}
              </div>
              <span className="vel-x">{w.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PriorityCard({ breakdown }) {
  const activeTotal = Object.values(breakdown).reduce((a, b) => a + b, 0)
  return (
    <div className="dash-card col-5">
      <div className="dash-card-h">
        <span className="dash-card-title"><Flag size={14} aria-hidden="true" />Priority — active tasks</span>
      </div>
      {!activeTotal
        ? <p style={{ color: 'var(--ink-4)', fontSize: 'var(--text-sm)' }}>No active tasks.</p>
        : (
          <div className="pri-list">
            {PRIORITY_META.filter(p => (breakdown[p.id] ?? 0) > 0).map(p => {
              const n   = breakdown[p.id] ?? 0
              const pct = activeTotal > 0 ? (n / activeTotal) * 100 : 0
              return (
                <div key={p.id} className="pri-row">
                  <span className="pri-label">{p.label}</span>
                  <div className="pri-track">
                    <i style={{ background: p.color, width: `${pct}%` }} />
                  </div>
                  <span className="pri-n">{n}</span>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

function HeatmapCard({ cells, year, onYearChange }) {
  const months = []
  let prevMonth = null
  let colIdx = 0, dayInCol = 0
  const cols = []
  let col = []

  for (const cell of (cells ?? [])) {
    col.push(cell)
    if (col.length === 7) { cols.push(col); col = []; colIdx++ }
    const m = dayjs(cell.date).month()
    if (!cell.faded && m !== prevMonth) {
      months.push({ idx: cols.length, label: dayjs(cell.date).format('MMM') })
      prevMonth = m
    }
  }
  if (col.length) cols.push(col)

  return (
    <div className="dash-card col-8 dash-heatmap-card">
      <div className="dash-card-h">
        <span className="dash-card-title"><CalendarDots size={14} aria-hidden="true" />Activity</span>
        <select
          style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '2px 6px', background: 'var(--card)', color: 'var(--ink-3)', cursor: 'pointer', outline: 'none' }}
          value={year}
          onChange={e => onYearChange(Number(e.target.value))}
          aria-label="Select year"
        >
          {AVAILABLE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="heat-months">
        {months.map((m, i) => <span key={i}>{m.label}</span>)}
      </div>
      <div className="heat">
        {cols.map((col, ci) => (
          <div key={ci} className="heat-col">
            {col.map(cell => (
              <div
                key={cell.date}
                className={`heat-cell${(cell.faded || cell.future) ? '' : (' ' + heatLevel(cell.count))}${cell.future ? ' heat-future' : ''}`}
                title={(!cell.faded && !cell.future) ? `${cell.date}: ${cell.count} task${cell.count !== 1 ? 's' : ''}` : undefined}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heat-legend">
        <span>Less</span>
        <div className="heat-cell" />
        <div className="heat-cell l1" />
        <div className="heat-cell l2" />
        <div className="heat-cell l3" />
        <div className="heat-cell l4" />
        <span>More</span>
      </div>
    </div>
  )
}

function RecentCard({ items }) {
  return (
    <div className="dash-card col-4">
      <div className="dash-card-h">
        <span className="dash-card-title"><CheckFat size={14} aria-hidden="true" />Recently completed</span>
      </div>
      {!items?.length
        ? <p style={{ color: 'var(--ink-4)', fontSize: 'var(--text-sm)' }}>No completed tasks yet.</p>
        : (
          <div className="done-list">
            {items.map(t => (
              <div key={t.id} className="done-row">
                <div className="done-check" aria-hidden="true">✓</div>
                <span className="done-t">{t.text}</span>
                <span className="done-when">{t.completed_at ? dayjs(t.completed_at).format('MMM D') : '—'}</span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

function WorkspaceSummary({ workspaces, breakdown }) {
  if (!workspaces?.length) return null
  return (
    <div className="dash-card col-12">
      <div className="dash-card-h">
        <span className="dash-card-title"><Stack size={14} aria-hidden="true" />Workspaces</span>
      </div>
      <div className="ws-grid">
        {workspaces.map((ws, i) => {
          const { active = 0, done = 0 } = breakdown[ws.id] ?? {}
          const total = active + done
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0
          const color = WS_COLORS[i % WS_COLORS.length]
          return (
            <div key={ws.id} className="ws-card">
              <div className="ws-card-top">
                <span className="ws-sq" style={{ background: color }}>{wsInitial(ws.name)}</span>
                <span className="ws-name">{ws.name}</span>
              </div>
              <div className="ws-stat">
                <span className="ws-active">{active}</span>
                <span className="ws-active-l">active</span>
              </div>
              <div className="ws-track">
                <i style={{ background: color, width: `${pct}%` }} />
              </div>
              <div className="ws-foot">
                <span>{done} done</span>
                <span>{pct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── main component ─────────────────────────────────────────── */

export default function DashboardView() {
  const [heatmapYear, setHeatmapYear] = useState(CURRENT_YEAR)
  const { data, loading, error } = useDashboard(heatmapYear)
  const { profile } = useAuth()
  const { workspaces } = useWorkspace()
  const firstName = profile?.first_name || profile?.email?.split('@')[0] || null

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

  const {
    stats, heatmap, statusBreakdown, priorityBreakdown,
    recentCompletions, dueSoon, weeklyVelocity, workspaceBreakdown = {},
  } = data

  const completionRate  = stats.totalTasks > 0
    ? Math.round((stats.totalCompleted / stats.totalTasks) * 100)
    : 0

  const thisWeekCount = weeklyVelocity?.[weeklyVelocity.length - 1]?.count ?? 0
  const lastWeekCount = weeklyVelocity?.[weeklyVelocity.length - 2]?.count ?? 0
  const velDelta      = thisWeekCount - lastWeekCount

  return (
    <div className="dashboard">

      {/* ── Header ───────────────────────────────────── */}
      <div className="dash-head">
        <div>
          {firstName && (
            <div className="dash-greeting">{timeGreeting()}, {firstName}</div>
          )}
          <h1 className="dash-title">{dayjs().format('dddd')}</h1>
          <div className="dash-date">
            {dayjs().format('MMMM D, YYYY')}
            {workspaces.length > 0 && ` · ${stats.activeTasks} active across ${workspaces.length} workspace${workspaces.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </div>

      {/* ── KPI tiles ────────────────────────────────── */}
      <div className="dash-grid dash-grid-row">
        <KpiTile
          icon={ListChecks}
          iconBg="var(--accent-tint)"
          iconColor="var(--accent)"
          value={stats.activeTasks}
          label="Active tasks"
          sub={`of ${stats.totalTasks} total`}
        />
        <KpiTile
          icon={CheckCircle}
          iconBg="var(--green-tint)"
          iconColor="var(--green)"
          value={stats.completedThisWeek}
          label="Done this week"
          delta={velDelta !== 0 ? `${velDelta > 0 ? '+' : ''}${velDelta}` : undefined}
          deltaDir={velDelta > 0 ? 'up' : velDelta < 0 ? 'down' : undefined}
        />
        <KpiTile
          icon={CalendarCheck}
          iconBg="var(--accent-tint)"
          iconColor="var(--accent)"
          value={stats.completedToday}
          label="Done today"
          sub={`${stats.completedThisWeek - stats.completedToday} yesterday`}
        />
        <KpiTile
          icon={ClockCountdown}
          iconBg="var(--amber-tint)"
          iconColor="var(--amber)"
          value={dueSoon.length}
          label="Due this week"
          sub={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
          delta={stats.overdue > 0 ? `${stats.overdue} overdue` : undefined}
          deltaDir={stats.overdue > 0 ? 'down' : undefined}
        />
      </div>

      {/* ── Progress + Due soon ───────────────────────── */}
      <div className="dash-grid dash-grid-row">
        <ProgressCard
          statusBreakdown={statusBreakdown}
          total={stats.totalTasks}
          completionRate={completionRate}
        />
        <DueSoonCard items={dueSoon} />
      </div>

      {/* ── Velocity + Priority ───────────────────────── */}
      <div className="dash-grid dash-grid-row">
        <VelocityCard
          weeks={weeklyVelocity}
          thisWeekCount={thisWeekCount}
          lastWeekCount={lastWeekCount}
        />
        <PriorityCard breakdown={priorityBreakdown} />
      </div>

      {/* ── Heatmap + Recent ─────────────────────────── */}
      <div className="dash-grid dash-grid-row">
        <HeatmapCard
          cells={heatmap}
          year={heatmapYear}
          onYearChange={setHeatmapYear}
        />
        <RecentCard items={recentCompletions} />
      </div>

      {/* ── Workspace summary ─────────────────────────── */}
      <div className="dash-grid">
        <WorkspaceSummary workspaces={workspaces} breakdown={workspaceBreakdown} />
      </div>

    </div>
  )
}
