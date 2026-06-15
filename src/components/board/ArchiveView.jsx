import { useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { Archive, ArrowCounterClockwise, Trash } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useArchive } from '../../hooks/useArchive'
import { useToast } from '../../contexts/ToastContext'

dayjs.extend(isoWeek)

function assigneeName(a) {
  if (!a) return null
  const full = [a.first_name, a.last_name].filter(Boolean).join(' ')
  return full || a.email?.split('@')[0] || null
}

function weekLabel(isoString) {
  const d     = dayjs(isoString)
  const start = d.startOf('isoWeek').format('MMM D')
  const end   = d.endOf('isoWeek').format('MMM D, YYYY')
  return `Week of ${start} – ${end}`
}

function groupByWeek(archives) {
  const groups = []
  const seen   = new Map()
  for (const task of archives) {
    const key = dayjs(task.archived_at).startOf('isoWeek').toISOString()
    if (!seen.has(key)) {
      seen.set(key, groups.length)
      groups.push({ key, label: weekLabel(task.archived_at), tasks: [] })
    }
    groups[seen.get(key)].tasks.push(task)
  }
  return groups
}

const TIME_FILTERS = [
  { id: 'all',   label: 'All time' },
  { id: 'year',  label: 'This year' },
  { id: 'month', label: 'This month' },
  { id: 'week',  label: 'This week' },
]

const STATUS_FILTERS = [
  { id: 'all',        label: 'All statuses' },
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

const STATUS_COLORS = {
  toDo:       'var(--ink-3)',
  inProgress: '#d97706',
  inReview:   '#0ea5e9',
  done:       'var(--green)',
}

export default function ArchiveView({ canEdit, canDelete, canArchiveNow }) {
  const { currentWorkspace, columnLabels } = useWorkspace()
  const { archives, loading, restoreTask, deleteArchive, archiveNow } =
    useArchive(currentWorkspace?.id)
  const { toast } = useToast()
  const [search,       setSearch]       = useState('')
  const [timeFilter,   setTimeFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const handleArchiveNow = async () => {
    try {
      const count = await archiveNow()
      toast.success(count > 0 ? `${count} task${count > 1 ? 's' : ''} archived` : 'No done tasks to archive')
    } catch (err) {
      toast.error(err.message || 'Archive failed')
    }
  }

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

  if (loading) return <div className="archive-loading">Loading archive…</div>

  const q    = search.trim().toLowerCase()
  const now  = dayjs()
  const filtered = archives.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (q && !t.text?.toLowerCase().includes(q)) return false
    if (timeFilter !== 'all') {
      const at = dayjs(t.archived_at)
      if (timeFilter === 'week'  && !at.isSame(now, 'week'))  return false
      if (timeFilter === 'month' && !at.isSame(now, 'month')) return false
      if (timeFilter === 'year'  && !at.isSame(now, 'year'))  return false
    }
    return true
  })

  const groups = groupByWeek(filtered)

  return (
    <div className="archive-view">
      <div className="archive-header">
        <div className="archive-header-info">
          <h2 className="arc-title">Archive</h2>
          <p className="arc-sub">
            Completed tasks are kept here — restore or delete anytime.
          </p>
        </div>
        {canArchiveNow && (
          <button className="btn-ghost btn-sm" onClick={handleArchiveNow}>
            Archive done tasks now
          </button>
        )}
      </div>

      {/* ── Filter bar ─────────────────────────────────────── */}
      <div className="arc-filters">
        <div className="arc-search">
          <i aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 256 256" fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="112" cy="112" r="80" /><line x1="168.57" y1="168.57" x2="224" y2="224" />
            </svg>
          </i>
          <input
            placeholder="Search archived tasks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search archived tasks"
          />
        </div>

        <div className="arc-pillrow">
          {TIME_FILTERS.map(f => (
            <button
              key={f.id}
              className={`arc-pill${timeFilter === f.id ? ' on' : ''}`}
              onClick={() => setTimeFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
          <span className="arc-divider" aria-hidden="true" />
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              className={`arc-pill${statusFilter === f.id ? ' on' : ''}`}
              onClick={() => setStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {archives.length > 0 && (
        <p className="arc-sub" style={{ marginBottom: 'var(--space-5)' }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          {filtered.length < archives.length && ` · showing ${filtered.length} of ${archives.length}`}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="archive-empty">
          <Archive size={48} className="archive-empty-icon" aria-hidden="true" />
          <p className="archive-empty-text">
            {q || statusFilter !== 'all' || timeFilter !== 'all'
              ? 'No tasks match your filters.'
              : 'Nothing archived yet.'}
          </p>
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
                const statusColor  = STATUS_COLORS[task.status] ?? 'var(--line)'
                const statusLabel  = columnLabels[task.status] ?? task.status
                const wsName       = task.workspace?.name
                const projName     = task.project?.name
                const assignee     = assigneeName(task.assignee)
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
                          {wsName && <span>{wsName}</span>}
                          {wsName && projName && <span className="sep">›</span>}
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
                      {canEdit && (
                        <button className="arc-restore" onClick={() => handleRestore(task)}>
                          <ArrowCounterClockwise size={15} aria-hidden="true" />
                          <span>Restore</span>
                        </button>
                      )}
                      {canDelete && (
                        <button className="arc-del" onClick={() => handleDelete(task)} aria-label="Permanently delete">
                          <Trash size={16} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
