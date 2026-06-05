import { useMemo, useState } from 'react'
import { List, Archive, MagnifyingGlass, ArrowCounterClockwise, Trash, X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import Sidebar from '../components/layout/Sidebar'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useArchive } from '../hooks/useArchive'
import { useToast } from '../contexts/ToastContext'

dayjs.extend(isoWeek)

const TIME_FILTERS = [
  { id: 'all',   label: 'All time' },
  { id: 'week',  label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'year',  label: 'This year' },
]

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
  const { currentWorkspace, columnLabels, userRole } = useWorkspace()
  const { archives, loading, restoreTask, deleteArchive, archiveNow } =
    useArchive(currentWorkspace?.id)
  const { toast } = useToast()

  const isOwner = userRole === 'owner'
  const canEdit = userRole !== 'viewer'

  const [showSidebar, setShowSidebar] = useState(false)
  const [search,      setSearch]      = useState('')
  const [timeFilter,  setTimeFilter]  = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const statuses = useMemo(() => {
    const seen = new Set(archives.map(t => t.status))
    return ['all', ...['toDo', 'inProgress', 'inReview', 'done'].filter(s => seen.has(s))]
  }, [archives])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = dayjs()
    return archives.filter(task => {
      if (q && !task.text.toLowerCase().includes(q)) return false
      if (statusFilter !== 'all' && task.status !== statusFilter) return false
      if (timeFilter === 'week'  && !dayjs(task.archived_at).isSame(now, 'week'))  return false
      if (timeFilter === 'month' && !dayjs(task.archived_at).isSame(now, 'month')) return false
      if (timeFilter === 'year'  && !dayjs(task.archived_at).isSame(now, 'year'))  return false
      return true
    })
  }, [archives, search, statusFilter, timeFilter])

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

  const handleArchiveNow = async () => {
    try {
      const count = await archiveNow()
      toast.success(count > 0
        ? `${count} done task${count > 1 ? 's' : ''} archived`
        : 'No done tasks to archive')
    } catch (err) {
      toast.error(err.message || 'Archive failed')
    }
  }

  const clearFilters = () => { setSearch(''); setTimeFilter('all'); setStatusFilter('all') }
  const hasActiveFilter = search || timeFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} />

      <main id="main-content" className="board-main">

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
            {currentWorkspace && (
              <span className="board-header-ws-name">{currentWorkspace.name}</span>
            )}
          </div>
          <div className="board-header-right">
            {isOwner && (
              <button className="btn-ghost btn-sm" onClick={handleArchiveNow}>
                Archive done tasks now
              </button>
            )}
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

          {/* Status chips — only show statuses that exist in the archive */}
          {statuses.length > 1 && (
            <div className="archive-filter-group" role="group" aria-label="Filter by column">
              {statuses.map(s => (
                <button
                  key={s}
                  className={`archive-chip${statusFilter === s ? ' archive-chip--active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                >
                  {s === 'all' ? 'All columns' : (columnLabels?.[s] ?? s)}
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
                          <span className="archive-row-meta">
                            {columnLabels?.[task.status] ?? task.status}
                            {task.due_date && ` · due ${dayjs(task.due_date).format('MMM D')}`}
                            {assigneeName(task.assignee) && ` · ${assigneeName(task.assignee)}`}
                          </span>
                          <span className="archive-row-date">
                            Archived {dayjs(task.archived_at).format('MMM D, YYYY [at] h:mm a')}
                          </span>
                        </div>
                        <div className="archive-row-actions">
                          {canEdit && (
                            <button
                              className="archive-action-btn"
                              onClick={() => handleRestore(task)}
                              title="Restore to To Do"
                              aria-label={`Restore "${task.text}"`}
                            >
                              <ArrowCounterClockwise size={15} weight="bold" aria-hidden="true" />
                              <span>Restore</span>
                            </button>
                          )}
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
