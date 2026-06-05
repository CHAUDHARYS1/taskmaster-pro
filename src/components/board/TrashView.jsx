import dayjs from 'dayjs'
import { TrashSimple, X } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTrash } from '../../hooks/useTrash'
import { useToast } from '../../contexts/ToastContext'

function daysLeft(deletedAt) {
  const diff = dayjs(deletedAt).add(30, 'day').diff(dayjs(), 'day')
  if (diff <= 0) return 'Expires today'
  if (diff === 1) return '1 day left'
  return `${diff} days left`
}

export default function TrashView({ canEdit, canDelete }) {
  const { currentWorkspace, columnLabels } = useWorkspace()
  const { trashed, loading, restoreTask, permanentlyDelete } = useTrash(currentWorkspace?.id)
  const { toast } = useToast()

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
      await permanentlyDelete(task.id)
      toast.success('Permanently deleted')
    } catch (err) {
      toast.error(err.message || 'Delete failed')
    }
  }

  if (loading) return <div className="archive-loading">Loading trash…</div>

  return (
    <div className="archive-view">
      <div className="archive-header">
        <div className="archive-header-info">
          <h2 className="archive-title">Trash</h2>
          <p className="archive-subtitle">
            Deleted tasks are kept for 30 days, then permanently removed.
            Restore a task to move it back to To Do.
          </p>
        </div>
      </div>

      {trashed.length === 0 ? (
        <div className="archive-empty">
          <TrashSimple size={48} className="archive-empty-icon" aria-hidden="true" />
          <p className="archive-empty-text">Trash is empty.</p>
        </div>
      ) : (
        <div className="archive-group">
          <div className="archive-group-list">
            {trashed.map(task => (
              <div key={task.id} className="archive-row">
                <div className="archive-row-main">
                  <span className="archive-row-text">{task.text}</span>
                  <span className="archive-row-meta">
                    {columnLabels[task.pre_delete_status] ?? task.pre_delete_status}
                    {task.project && ` · ${task.project.name}`}
                    {task.due_date && ` · due ${dayjs(task.due_date).format('MMM D')}`}
                  </span>
                  <span className="archive-row-date">
                    Deleted {dayjs(task.deleted_at).format('MMM D, h:mm a')}
                    {' · '}
                    <span className="trash-expiry">{daysLeft(task.deleted_at)}</span>
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
                      title="Permanently delete"
                    >
                      <X size={18} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
