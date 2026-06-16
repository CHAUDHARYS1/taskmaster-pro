import { lazy, Suspense, useMemo, useState } from 'react'
import { List, Archive, MagnifyingGlass, ArrowCounterClockwise, Trash, X } from '@phosphor-icons/react'
import PageHint from '../components/ui/PageHint'

const SettingsModal = lazy(() => import('../components/ui/SettingsModal'))
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Sidebar from '../components/layout/Sidebar'
import { useArchive } from '../hooks/useArchive'
import { useToast } from '../contexts/ToastContext'

dayjs.extend(isoWeek)

const TIME_FILTERS = [
  { id: 'all',   label: 'All time' },
  { id: 'year',  label: 'This year' },
  { id: 'month', label: 'This month' },
  { id: 'week',  label: 'This week' },
]

const STATUS_LABELS = {
  toDo:       'To Do',
  inProgress: 'In Progress',
  inReview:   'In Review',
  done:       'Done',
}

const STATUS_COLORS = {
  toDo:       'var(--ink-3)',
  inProgress: '#d97706',
  inReview:   '#0ea5e9',
  done:       'var(--green)',
}

function assigneeName(a) {
  if (!a) return null
  const full = [a.first_name, a.last_name].filter(Boolean).join(' ')
  return full || a.email?.split('@')[0] || null
}

function weekLabel(isoString) {
  const d = dayjs(isoString)
  return `Week of ${d.startOf('isoWeek').format('MMM D')} – ${d.endOf('isoWeek').format('MMM D, YYYY')}`
}

function groupByWeek(tasks) {
  const groups = []
  const seen   = new Map()
  for (const task of tasks) {
    const key = dayjs(task.archived_at).startOf('isoWeek').toISOString()
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ key, label: weekLabel(task.archived_at), tasks: [] })
    }
    groups[seen.get(key)].tasks.push(task)
  }
  return groups
}

export default function ArchivePage() {
  const { archives, loading, restoreTask, deleteArchive } = useArchive(null)
  const { toast } = useToast()

  const [showSidebar,      setShowSidebar]      = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [showSettings,  setShowSettings]  = useState(false)
  const [search,        setSearch]        = useState('')
  const [timeFilter,    setTimeFilter]    = useState('all')
  const [statusFilter,  setStatusFilter]  = useState('all')
  const [wsFilter,      setWsFilter]      = useState('')
  const [projectFilter, setProjectFilter] = useState('')

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  const workspaceOptions = useMemo(() => {
    const map = new Map()
    for (const t of archives) {
      if (t.workspace && !map.has(t.workspace_id)) map.set(t.workspace_id, t.workspace)
    }
    return [...map.entries()].map(([id, ws]) => ({ id, name: ws.name }))
  }, [archives])

  const projectOptions = useMemo(() => {
    const map = new Map()
    const source = wsFilter ? archives.filter(t => t.workspace_id === wsFilter) : archives
    for (const t of source) {
      if (t.project && t.project_id && !map.has(t.project_id)) map.set(t.project_id, t.project)
    }
    return [...map.entries()].map(([id, p]) => ({ id, name: p.name, color: p.color }))
  }, [archives, wsFilter])

  const statuses = useMemo(() => {
    const seen = new Set(archives.map(t => t.status))
    return ['all', ...['toDo', 'inProgress', 'inReview', 'done'].filter(s => seen.has(s))]
  }, [archives])

  const filtered = useMemo(() => {
    const q   = search.trim().toLowerCase()
    const now = dayjs()
    return archives.filter(task => {
      if (q && !task.text.toLowerCase().includes(q)) return false
      if (wsFilter      && task.workspace_id !== wsFilter)      return false
      if (projectFilter && task.project_id   !== projectFilter) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (timeFilter === 'week'  && !dayjs(task.archived_at).isSame(now, 'week'))  return false
      if (timeFilter === 'month' && !dayjs(task.archived_at).isSame(now, 'month')) return false
      if (timeFilter === 'year'  && !dayjs(task.archived_at).isSame(now, 'year'))  return false
      return true
    })
  }, [archives, search, wsFilter, projectFilter, statusFilter, timeFilter])

  const groups = useMemo(() => groupByWeek(filtered), [filtered])

  const handleRestore = async (task) => {
    try {
      await restoreTask(task.id)
      toast.success(`"${task.text}" restored to To Do`)
    } catch (err) {
      toast.error(err.message || 'Restore failed')
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Permanently delete "${task.text}"? This cannot be undone.`)) return
    try {
      await deleteArchive(task.id)
      toast.success('Deleted from archive')
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  const clearFilters = () => {
    setSearch('')
    setTimeFilter('all')
    setStatusFilter('all')
    setWsFilter('')
    setProjectFilter('')
  }

  const hasActiveFilter = search || timeFilter !== 'all' || statusFilter !== 'all' || wsFilter || projectFilter

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} onProfileClick={() => setShowSettings(true)} />

      <main id="main-content" className="board-main board-main--archive">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <Archive size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Archive</span>
          </div>
          <div className="board-header-right">
            <PageHint text="Archived tasks live here. Search and filter by workspace, project, or date. Restore a task to To Do, or permanently delete it." />
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="archive-view">

          <div className="archive-header">
            <div>
              <h2 className="arc-title">Archive</h2>
              <p className="arc-sub">Completed tasks are kept here — restore or delete anytime.</p>
            </div>
          </div>

          {/* Filter bar */}
          <div className="arc-filters">
            <div className="arc-search">
              <i aria-hidden="true">
                <MagnifyingGlass size={14} />
              </i>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search archived tasks…"
                aria-label="Search archived tasks"
              />
              {search && (
                <button
                  style={{ position: 'absolute', right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={12} weight="bold" />
                </button>
              )}
            </div>

            <div className="arc-pillrow">
              {/* Workspace select */}
              {workspaceOptions.length > 1 && (
                <select
                  style={{ height: 26, padding: '0 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', outline: 'none' }}
                  value={wsFilter}
                  onChange={e => { setWsFilter(e.target.value); setProjectFilter('') }}
                  aria-label="Filter by workspace"
                >
                  <option value="">All workspaces</option>
                  {workspaceOptions.map(ws => (
                    <option key={ws.id} value={ws.id}>{ws.name}</option>
                  ))}
                </select>
              )}

              {/* Project select */}
              {projectOptions.length > 1 && (
                <select
                  style={{ height: 26, padding: '0 8px', border: '1px solid var(--line)', borderRadius: 'var(--radius)', background: 'var(--card)', color: 'var(--ink-2)', fontSize: 'var(--text-sm)', cursor: 'pointer', outline: 'none' }}
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  aria-label="Filter by project"
                >
                  <option value="">All projects</option>
                  {projectOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Time pills */}
              {TIME_FILTERS.map(f => (
                <button
                  key={f.id}
                  className={`arc-pill${timeFilter === f.id ? ' on' : ''}`}
                  onClick={() => setTimeFilter(f.id)}
                  aria-pressed={timeFilter === f.id}
                >
                  {f.label}
                </button>
              ))}

              <span className="arc-divider" aria-hidden="true" />

              {/* Status pills */}
              {statuses.map(s => (
                <button
                  key={s}
                  className={`arc-pill${statusFilter === s ? ' on' : ''}`}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s === 'all' ? 'All statuses' : (STATUS_LABELS[s] ?? s)}
                </button>
              ))}

              {hasActiveFilter && (
                <button
                  className="arc-pill"
                  onClick={clearFilters}
                  style={{ color: 'var(--red)', borderColor: 'rgba(185,28,28,0.3)' }}
                >
                  <X size={11} weight="bold" aria-hidden="true" /> Clear
                </button>
              )}
            </div>
          </div>

          {archives.length > 0 && (
            <p className="arc-sub" style={{ marginBottom: 'var(--space-5)' }}>
              {filtered.length} task{filtered.length !== 1 ? 's' : ''}
              {filtered.length < archives.length && ` · showing ${filtered.length} of ${archives.length}`}
            </p>
          )}

          {/* Content */}
          {loading ? (
            <div className="archive-loading">Loading archive…</div>
          ) : groups.length === 0 ? (
            <div className="archive-empty">
              <Archive size={48} className="archive-empty-icon" aria-hidden="true" />
              <p className="archive-empty-text">
                {hasActiveFilter ? 'No tasks match your filters.' : 'Nothing archived yet.'}
              </p>
              {hasActiveFilter && (
                <button className="btn-ghost btn-sm" onClick={clearFilters} style={{ marginTop: 'var(--space-2)' }}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            groups.map(group => (
              <div key={group.key} className="arc-group">
                <div className="arc-group-h">
                  {group.label}
                  <span className="arc-gcount">{group.tasks.length}</span>
                </div>
                <div className="arc-list">
                  {group.tasks.map(task => {
                    const statusColor = STATUS_COLORS[task.status] ?? 'var(--line)'
                    const statusLabel = STATUS_LABELS[task.status]  ?? task.status
                    const wsName      = task.workspace?.name
                    const projName    = task.project?.name
                    const assignee    = assigneeName(task.assignee)
                    return (
                      <div
                        key={task.id}
                        className="arc-row"
                        style={{ '--c': statusColor }}
                      >
                        <div className="arc-main">
                          <div className="arc-t">{task.text}</div>
                          {(wsName || projName) && (
                            <div className="arc-crumb">
                              {wsName  && <span>{wsName}</span>}
                              {wsName && projName && <span className="sep" aria-hidden="true">›</span>}
                              {projName && <span>{projName}</span>}
                            </div>
                          )}
                          <div className="arc-meta">
                            <span className="arc-status">
                              <span className="dot" style={{ background: statusColor }} />
                              {statusLabel}
                            </span>
                            {task.due_date && (
                              <>
                                <span className="mdot">·</span>
                                <span className="mono">due {dayjs(task.due_date).format('MMM D')}</span>
                              </>
                            )}
                            {assignee && (
                              <>
                                <span className="mdot">·</span>
                                <span>{assignee}</span>
                              </>
                            )}
                            <span className="mdot">·</span>
                            <span className="mono">Archived {dayjs(task.archived_at).format('MMM D, h:mm a')}</span>
                          </div>
                        </div>
                        <div className="arc-actions">
                          <button
                            className="arc-restore"
                            onClick={() => handleRestore(task)}
                            aria-label={`Restore "${task.text}"`}
                          >
                            <ArrowCounterClockwise size={15} aria-hidden="true" />
                            <span>Restore</span>
                          </button>
                          <button
                            className="arc-del"
                            onClick={() => handleDelete(task)}
                            aria-label={`Delete "${task.text}"`}
                          >
                            <Trash size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <Suspense fallback={null}>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </Suspense>
    </div>
  )
}
