import { useMemo, useState } from 'react'
import { List, Archive, MagnifyingGlass, ArrowCounterClockwise, Trash, X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Sidebar from '../components/layout/Sidebar'
import UtilityBar from '../components/layout/UtilityBar'
import { useArchive } from '../hooks/useArchive'
import { useToast } from '../contexts/ToastContext'

dayjs.extend(isoWeek)

const TIME_FILTERS = [
  { id: 'all',   label: 'All time' },
  { id: 'week',  label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year',  label: 'This year' },
]

const STATUS_LABELS = {
  toDo:       'To Do',
  inProgress: 'In Progress',
  inReview:   'In Review',
  done:       'Done',
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
  // null = fetch all workspaces (RLS scopes to user's memberships)
  const { archives, loading, restoreTask, deleteArchive } = useArchive(null)
  const { toast } = useToast()

  const [showSidebar,      setShowSidebar]      = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
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

  // Unique workspaces from the archive data
  const workspaceOptions = useMemo(() => {
    const map = new Map()
    for (const t of archives) {
      if (t.workspace && !map.has(t.workspace_id)) {
        map.set(t.workspace_id, t.workspace)
      }
    }
    return [...map.entries()].map(([id, ws]) => ({ id, name: ws.name }))
  }, [archives])

  // Projects for the selected workspace (or all projects if no workspace selected)
  const projectOptions = useMemo(() => {
    const map = new Map()
    const source = wsFilter ? archives.filter(t => t.workspace_id === wsFilter) : archives
    for (const t of source) {
      if (t.project && t.project_id && !map.has(t.project_id)) {
        map.set(t.project_id, t.project)
      }
    }
    return [...map.entries()].map(([id, p]) => ({ id, name: p.name, color: p.color }))
  }, [archives, wsFilter])

  // Available statuses
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
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <main id="main-content" className="board-main">
        <UtilityBar />

        {/* ── Header ───────────────────────────────────────── */}
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
        </div>

        {/* ── Filter bar ───────────────────────────────────── */}
        <div className="archive-page-filters">

          {/* Search */}
          <div className="archive-search-wrap">
            <MagnifyingGlass size={15} className="archive-search-icon" aria-hidden="true" />
            <input
              className="archive-search-input"
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search archived tasks…"
              aria-label="Search archived tasks"
            />
            {search && (
              <button className="archive-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={13} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Workspace select */}
          {workspaceOptions.length > 1 && (
            <select
              className="archive-filter-select"
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
              className="archive-filter-select"
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

          {/* Time chips */}
          <div className="archive-filter-group" role="group" aria-label="Time range">
            {TIME_FILTERS.map(f => (
              <button
                key={f.id}
                className={`archive-chip${timeFilter === f.id ? ' archive-chip--active' : ''}`}
                onClick={() => setTimeFilter(f.id)}
                aria-pressed={timeFilter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Status chips */}
          {statuses.length > 1 && (
            <div className="archive-filter-group" role="group" aria-label="Filter by status">
              {statuses.map(s => (
                <button
                  key={s}
                  className={`archive-chip${statusFilter === s ? ' archive-chip--active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s === 'all' ? 'All statuses' : (STATUS_LABELS[s] ?? s)}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilter && (
            <button className="archive-chip archive-chip--clear" onClick={clearFilters}>
              <X size={12} weight="bold" aria-hidden="true" /> Clear
            </button>
          )}
        </div>

        {/* ── Content ──────────────────────────────────────── */}
        <div className="archive-page-body">
          {loading ? (
            <div className="archive-loading">Loading archive…</div>
          ) : groups.length === 0 ? (
            <div className="archive-empty">
              <Archive size={48} className="archive-empty-icon" aria-hidden="true" />
              <p className="archive-empty-text">
                {hasActiveFilter ? 'No tasks match your filters.' : 'Nothing archived yet.'}
              </p>
              {hasActiveFilter && (
                <button className="btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
              )}
            </div>
          ) : (
            <div className="archive-list">
              <p className="archive-result-count">
                {filtered.length} task{filtered.length !== 1 ? 's' : ''}
              </p>
              {groups.map(group => (
                <div key={group.key} className="archive-group">
                  <p className="archive-group-label">{group.label}</p>
                  <div className="archive-group-list">
                    {group.tasks.map(task => (
                      <div key={task.id} className="archive-row">
                        <div className="archive-row-main">
                          <span className="archive-row-text">{task.text}</span>

                          {/* Workspace · Project breadcrumb */}
                          <span className="archive-row-context">
                            {task.workspace?.name && (
                              <span className="archive-row-context-ws">{task.workspace.name}</span>
                            )}
                            {task.workspace?.name && task.project?.name && (
                              <span className="archive-row-context-sep" aria-hidden="true">›</span>
                            )}
                            {task.project?.name && (
                              <span
                                className="archive-row-context-project"
                                style={task.project.color ? { '--proj-color': task.project.color } : {}}
                              >
                                {task.project.name}
                              </span>
                            )}
                          </span>

                          <span className="archive-row-meta">
                            {STATUS_LABELS[task.status] ?? task.status}
                            {task.due_date && ` · due ${dayjs(task.due_date).format('MMM D')}`}
                            {assigneeName(task.assignee) && ` · ${assigneeName(task.assignee)}`}
                          </span>
                          <span className="archive-row-date">
                            Archived {dayjs(task.archived_at).format('MMM D, YYYY [at] h:mm a')}
                          </span>
                        </div>
                        <div className="archive-row-actions">
                          <button
                            className="archive-action-btn"
                            onClick={() => handleRestore(task)}
                            title="Restore to To Do"
                            aria-label={`Restore "${task.text}"`}
                          >
                            <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
                            <span>Restore</span>
                          </button>
                          <button
                            className="archive-action-btn archive-action-btn--danger"
                            onClick={() => handleDelete(task)}
                            title="Permanently delete"
                            aria-label={`Delete "${task.text}"`}
                          >
                            <Trash size={15} weight="bold" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
