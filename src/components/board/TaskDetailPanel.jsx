import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { useTaskDetail } from '../../hooks/useTaskDetail'

const STATUS_LABELS = {
  toDo: 'To Do',
  inProgress: 'In Progress',
  inReview: 'In Review',
  done: 'Done',
}

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

export default function TaskDetailPanel({ task, canEdit, onUpdate, onClose }) {
  const { user } = useAuth()
  const { comments, loading: commentsLoading, addComment, deleteComment } = useTaskDetail(task.id)

  const [title, setTitle]           = useState(task.text)
  const [description, setDescription] = useState(task.description ?? '')
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting]  = useState(false)

  const commentInputRef = useRef(null)

  // Keep local title/description in sync if task updates from real-time
  useEffect(() => { setTitle(task.text) }, [task.text])
  useEffect(() => { setDescription(task.description ?? '') }, [task.description])

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
            <span className={`task-panel-status ${urgencyClass(task.due_date)}`}>
              {STATUS_LABELS[task.status]}
            </span>
            {task.due_date && (
              <span className={`task-badge ${urgencyClass(task.due_date)}`}>
                {dayjs(task.due_date).format('MMM D')}
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
