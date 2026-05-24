import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import { supabase } from '../../lib/supabase'
import { LABELS } from '../../lib/labels'
import { PRIORITIES } from '../../lib/priority'

const STATUS_OPTIONS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]
const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map(s => [s.id, s.label]))

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

export default function TaskDetailPanel({ task, canEdit, onUpdate, onClose }) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const { comments, loading: commentsLoading, addComment, deleteComment } = useTaskDetail(task.id)

  const [title, setTitle]           = useState(task.text)
  const [description, setDescription] = useState(task.description ?? '')
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting]  = useState(false)
  const [members, setMembers]        = useState([])

  const commentInputRef = useRef(null)

  // Keep local title/description in sync if task updates from real-time
  useEffect(() => { setTitle(task.text) }, [task.text])
  useEffect(() => { setDescription(task.description ?? '') }, [task.description])

  // Fetch workspace members for the assignee dropdown
  useEffect(() => {
    if (!currentWorkspace?.id) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email')
      .eq('workspace_id', currentWorkspace.id)
      .then(({ data }) => { if (data) setMembers(data) })
  }, [currentWorkspace?.id])

  const saveTitle = () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== task.text) onUpdate(task.id, { text: trimmed })
    else setTitle(task.text)
  }

  const saveDescription = () => {
    const trimmed = description.trim()
    if (trimmed !== (task.description ?? '').trim()) {
      onUpdate(task.id, { description: trimmed || null })
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    const body = commentBody.trim()
    if (!body) return
    setSubmitting(true)
    try {
      await addComment(body)
      setCommentBody('')
      toast.success('Comment added')
    } catch (err) {
      toast.error(err.message || 'Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="task-panel" role="complementary" aria-label="Task detail">
        <div className="task-panel-hdr">
          <div className="task-panel-meta">
            {canEdit ? (
              <select
                className={`task-panel-status-select ${urgencyClass(task.due_date)}`}
                value={task.status}
                onChange={e => onUpdate(task.id, { status: e.target.value })}
                aria-label="Task status"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            ) : (
              <span className={`task-panel-status ${urgencyClass(task.due_date)}`}>
                {STATUS_LABELS[task.status]}
              </span>
            )}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close panel">×</button>
        </div>

        <div className="task-panel-body">
          {canEdit ? (
            <textarea
              className="task-panel-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur() } }}
              aria-label="Task title"
            />
          ) : (
            <h2 className="task-panel-title-ro">{task.text}</h2>
          )}

          <div className="task-panel-section">
            <p className="task-panel-label">Description</p>
            {canEdit ? (
              <textarea
                className="task-panel-desc-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                onBlur={saveDescription}
                placeholder="Add a description…"
                rows={4}
              />
            ) : (
              <p className="task-panel-desc-ro">
                {task.description || <span className="task-panel-empty">No description.</span>}
              </p>
            )}
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">Assignee</p>
            {canEdit ? (
              <select
                className="assignee-select"
                value={task.assignee_id ?? ''}
                onChange={e => onUpdate(task.id, { assignee_id: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.email}</option>
                ))}
              </select>
            ) : (
              <p className="task-panel-desc-ro">
                {task.assignee?.email ?? <span className="task-panel-empty">Unassigned</span>}
              </p>
            )}
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">Due date</p>
            {canEdit ? (
              <div className="due-date-row">
                <input
                  type="date"
                  className="due-date-input"
                  value={task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : ''}
                  onChange={e => onUpdate(task.id, { due_date: e.target.value || null })}
                  aria-label="Due date"
                />
                {task.due_date && (
                  <button
                    className="due-date-clear"
                    onClick={() => onUpdate(task.id, { due_date: null })}
                    aria-label="Clear due date"
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <p className={`task-panel-desc-ro ${urgencyClass(task.due_date)}`}>
                {task.due_date
                  ? dayjs(task.due_date).format('MMM D, YYYY')
                  : <span className="task-panel-empty">No due date.</span>
                }
              </p>
            )}
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">Priority</p>
            <div className="priority-picker">
              {PRIORITIES.map(p => {
                const active = task.priority === p.id
                return canEdit ? (
                  <button
                    key={p.id}
                    className={`priority-btn${active ? ' priority-btn--active' : ''}`}
                    style={{ '--p-color': p.color, '--p-bg': p.bg }}
                    onClick={() => onUpdate(task.id, { priority: active ? null : p.id })}
                    title={active ? 'Click to clear' : undefined}
                  >
                    <span className="priority-icon">{p.icon}</span>
                    {p.name}
                  </button>
                ) : active ? (
                  <span
                    key={p.id}
                    className="priority-btn priority-btn--active"
                    style={{ '--p-color': p.color, '--p-bg': p.bg }}
                  >
                    <span className="priority-icon">{p.icon}</span>
                    {p.name}
                  </span>
                ) : null
              })}
              {!task.priority && !canEdit && (
                <span className="task-panel-empty">No priority.</span>
              )}
            </div>
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">Labels</p>
            <div className="label-picker">
              {LABELS.map(label => {
                const active = (task.labels ?? []).includes(label.id)
                return canEdit ? (
                  <button
                    key={label.id}
                    className={`label-chip${active ? ' label-chip--active' : ''}`}
                    style={{ '--label-color': label.color, '--label-bg': label.bg }}
                    onClick={() => {
                      const current = task.labels ?? []
                      const next = active
                        ? current.filter(l => l !== label.id)
                        : [...current, label.id]
                      onUpdate(task.id, { labels: next })
                    }}
                  >
                    {label.name}
                  </button>
                ) : active ? (
                  <span
                    key={label.id}
                    className="label-chip label-chip--active"
                    style={{ '--label-color': label.color, '--label-bg': label.bg }}
                  >
                    {label.name}
                  </span>
                ) : null
              })}
              {!(task.labels ?? []).length && !canEdit && (
                <span className="task-panel-empty">No labels.</span>
              )}
            </div>
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">
              Activity
              {!commentsLoading && comments.length > 0 && (
                <span className="task-panel-count">{comments.length}</span>
              )}
            </p>

            <div className="task-panel-activity">
              <div className="activity-item activity-item--created">
                <span className="activity-dot" />
                <span className="activity-text">
                  Task created {dayjs(task.created_at).format('MMM D, YYYY')}
                </span>
              </div>

              {comments.map(c => (
                <div key={c.id} className="activity-item activity-item--comment">
                  <div className="comment-avatar" aria-hidden="true">
                    {c.profiles?.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="comment-body">
                    <div className="comment-meta">
                      <span className="comment-author">
                        {c.profiles?.email?.split('@')[0] ?? 'Unknown'}
                      </span>
                      <span className="comment-time">
                        {dayjs(c.created_at).format('MMM D, h:mm a')}
                      </span>
                      {c.user_id === user?.id && (
                        <button
                          className="comment-delete"
                          onClick={() => deleteComment(c.id)}
                          aria-label="Delete comment"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <p className="comment-text">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {canEdit && (
              <form className="comment-form" onSubmit={handleAddComment}>
                <textarea
                  ref={commentInputRef}
                  className="comment-input"
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(e) }
                  }}
                />
                <div className="comment-form-ftr">
                  <span className="comment-hint">Enter to submit · Shift+Enter for new line</span>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!commentBody.trim() || submitting}
                  >
                    {submitting ? 'Saving…' : 'Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
