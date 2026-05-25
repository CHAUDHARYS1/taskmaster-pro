import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useArchive } from '../../hooks/useArchive'
import { useToast } from '../../contexts/ToastContext'

dayjs.extend(isoWeek)

const STATUS_LABELS = {
  toDo: 'To Do', inProgress: 'In Progress', inReview: 'In Review', done: 'Done',
}

function assigneeName(a) {
  if (!a) return null
  const full = [a.first_name, a.last_name].filter(Boolean).join(' ')
  return full || a.email?.split('@')[0] || null
}

function weekLabel(isoString) {
  const d = dayjs(isoString)
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

export default function ArchiveView({ canEdit, canDelete }) {
  const { currentWorkspace } = useWorkspace()
  const { archives, loading, restoreTask, deleteArchive, archiveNow } =
    useArchive(currentWorkspace?.id)
  const { toast } = useToast()

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

  const groups = groupByWeek(archives)

  return (
    <div className="archive-view">
      <div className="archive-header">
        <div className="archive-header-info">
          <h2 className="archive-title">Archive</h2>
          <p className="archive-subtitle">
            Done tasks are archived automatically every Friday at 9 PM and purged after 30 days.
          </p>
        </div>
        {canDelete && (
          <button className="btn-ghost btn-sm" onClick={handleArchiveNow}>
            Archive done tasks now
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="archive-empty">
          <p className="archive-empty-icon" aria-hidden="true">🗂</p>
          <p className="archive-empty-text">Nothing archived yet.</p>
        </div>
      ) : (
        groups.map(group => (
          <div key={group.key} className="archive-group">
            <p className="archive-group-label">{group.label}</p>
            <div className="archive-group-list">
              {group.tasks.map(task => (
                <div key={task.id} className="archive-row">
                  <div className="archive-row-main">
                    <span className="archive-row-text">{task.text}</span>
                    <span className="archive-row-meta">
                      {STATUS_LABELS[task.status] ?? task.status}
                      {task.due_date && ` · due ${dayjs(task.due_date).format('MMM D')}`}
                      {assigneeName(task.assignee) && ` · ${assigneeName(task.assignee)}`}
                    </span>
                    <span className="archive-row-date">
                      Archived {dayjs(task.archived_at).format('MMM D, h:mm a')}
                    </span>
                  </div>
                  <div className="archive-row-actions">
                    {canEdit && (
                      <button
                        className="btn-ghost btn-sm"
                        onClick={() => handleRestore(task)}
                      >
                        Restore
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="btn-ghost btn-sm archive-delete-btn"
                        onClick={() => handleDelete(task)}
                        aria-label="Permanently delete"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
