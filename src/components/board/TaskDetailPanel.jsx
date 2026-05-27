import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import { supabase } from '../../lib/supabase'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import ManageLabelsModal from '../workspace/ManageLabelsModal'
import TiptapEditor from '../ui/TiptapEditor'
import { PRIORITIES } from '../../lib/priority'

function toHtml(text) {
  if (!text) return ''
  if (text.trim().startsWith('<')) return text
  return text.split('\n').filter(s => s.trim()).map(l => `<p>${l}</p>`).join('') || ''
}

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}

function commentAuthor(profiles) {
  if (!profiles) return 'Unknown'
  const full = [profiles.first_name, profiles.last_name].filter(Boolean).join(' ')
  return full || profiles.email?.split('@')[0] || 'Unknown'
}

const DEFAULT_STATUS_OPTIONS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

export default function TaskDetailPanel({ task, columns = DEFAULT_STATUS_OPTIONS, canEdit, autoSave = true, onUpdate, onClose }) {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const { labels, labelMap } = useLabelsCtx()
  const { comments, loading: commentsLoading, addComment, deleteComment, updateComment } = useTaskDetail(task.id)

  const [title, setTitle]           = useState(task.text)
  const [description, setDescription] = useState(() => toHtml(task.description ?? ''))
  const [commentBody, setCommentBody]         = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [submitting, setSubmitting]  = useState(false)
  const [members, setMembers]        = useState([])
  const [showManageLabels, setShowManageLabels] = useState(false)

  const commentInputRef = useRef(null)
  const titleRef = useRef(null)

  // Auto-resize title textarea to fit content
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [title])

  // Keep local title/description in sync if task updates from real-time
  useEffect(() => { setTitle(task.text) }, [task.text])
  useEffect(() => { setDescription(toHtml(task.description ?? '')) }, [task.description])

  // Fetch workspace members for the assignee dropdown
  useEffect(() => {
    if (!currentWorkspace?.id) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email, first_name, last_name')
      .eq('workspace_id', currentWorkspace.id)
      .then(({ data }) => { if (data) setMembers(data) })
  }, [currentWorkspace?.id])

  const titleChanged = title.trim() !== task.text
  const descChanged  = (description || null) !== (toHtml(task.description) || null)
  const hasPending   = !autoSave && canEdit && (titleChanged || descChanged)

  const saveTitle = () => {
    const trimmed = title.trim()
    if (!trimmed) { setTitle(task.text); return }
    if (autoSave && trimmed !== task.text) onUpdate(task.id, { text: trimmed })
  }

  const saveDescription = () => {
    const newVal = description || null
    if (autoSave && newVal !== (toHtml(task.description) || null)) {
      onUpdate(task.id, { description: newVal })
    }
  }

  const handleSave = () => {
    const updates = {}
    const t = title.trim()
    if (t && t !== task.text) updates.text = t
    const d = description || null
    if (d !== (toHtml(task.description) || null)) updates.description = d
    if (Object.keys(updates).length) onUpdate(task.id, updates)
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
                className={`task-panel-status-select ${task.status !== 'done' ? urgencyClass(task.due_date) : ''}`}
                value={task.status}
                onChange={e => onUpdate(task.id, { status: e.target.value })}
                aria-label="Task status"
              >
                {columns.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            ) : (
              <span className={`task-panel-status ${task.status !== 'done' ? urgencyClass(task.due_date) : ''}`}>
                {columns.find(s => s.id === task.status)?.label ?? task.status}
              </span>
            )}
          </div>
          <div className="task-panel-hdr-right">
            {hasPending && (
              <button className="btn-primary btn-sm task-panel-save-btn" onClick={handleSave}>
                Save
              </button>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Close panel"><X size={18} weight="bold" aria-hidden="true" /></button>
          </div>
        </div>

        <div className="task-panel-body">
          {canEdit ? (
            <textarea
              ref={titleRef}
              className="task-panel-title-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur() } }}
              aria-label="Task title"
              rows={1}
            />
          ) : (
            <h2 className="task-panel-title-ro">{task.text}</h2>
          )}

          <div className="task-panel-section">
            <p className="task-panel-label">Description</p>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              onBlur={saveDescription}
              editable={canEdit}
            />
            {!canEdit && !task.description && (
              <span className="task-panel-empty">No description.</span>
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
                  <option key={m.user_id} value={m.user_id}>{memberDisplayName(m)}</option>
                ))}
              </select>
            ) : (
              <p className="task-panel-desc-ro">
                {task.assignee
                  ? memberDisplayName(task.assignee)
                  : <span className="task-panel-empty">Unassigned</span>
                }
              </p>
            )}
          </div>

          <div className="task-panel-section">
            <p className="task-panel-label">Due date &amp; time</p>
            {canEdit ? (
              <div className="due-date-row">
                <input
                  type="date"
                  className="due-date-input"
                  value={task.due_date ? dayjs(task.due_date).format('YYYY-MM-DD') : ''}
                  onChange={e => onUpdate(task.id, { due_date: e.target.value || null, ...(!e.target.value && { due_time: null }) })}
                  aria-label="Due date"
                />
                <input
                  key={task.due_time ?? 'no-time'}
                  type="time"
                  className="due-time-input"
                  defaultValue={task.due_time ?? ''}
                  onBlur={e => { if (e.target.value !== (task.due_time ?? '')) onUpdate(task.id, { due_time: e.target.value || null }) }}
                  disabled={!task.due_date}
                  aria-label="Due time"
                />
                {task.due_date && (
                  <button
                    className="due-date-clear"
                    onClick={() => onUpdate(task.id, { due_date: null, due_time: null })}
                    aria-label="Clear due date"
                  >
                    <X size={16} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>
            ) : (
              <p className={`task-panel-desc-ro ${task.status !== 'done' ? urgencyClass(task.due_date) : ''}`}>
                {task.due_date
                  ? `${dayjs(task.due_date).format('MMM D, YYYY')}${task.due_time ? ` at ${dayjs(`2000-01-01T${task.due_time}`).format('h:mm A')}` : ''}`
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
            <p className="task-panel-label">
              Labels
              {canEdit && (
                <button
                  className="task-panel-manage-btn"
                  onClick={() => setShowManageLabels(true)}
                  title="Manage labels"
                >
                  Manage
                </button>
              )}
            </p>
            <div className="label-picker">
              {labels.length === 0 && canEdit && (
                <button
                  className="label-create-hint"
                  onClick={() => setShowManageLabels(true)}
                >
                  + Create your first label
                </button>
              )}
              {labels.map(label => {
                const active = (task.labels ?? []).includes(label.id)
                const rgb = label.color.length === 7
                  ? `${parseInt(label.color.slice(1,3),16)},${parseInt(label.color.slice(3,5),16)},${parseInt(label.color.slice(5,7),16)}`
                  : '37,99,235'
                return canEdit ? (
                  <button
                    key={label.id}
                    className={`label-chip${active ? ' label-chip--active' : ''}`}
                    style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
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
                    style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
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
                      <span className="comment-author">{commentAuthor(c.profiles)}</span>
                      <span className="comment-time">
                        {dayjs(c.created_at).format('MMM D, h:mm a')}
                        {c.updated_at && c.updated_at !== c.created_at && (
                          <span className="comment-edited"> (edited)</span>
                        )}
                      </span>
                      {c.user_id === user?.id && editingCommentId !== c.id && (
                        <span className="comment-actions">
                          <button
                            className="comment-action-btn"
                            onClick={() => { setEditingCommentId(c.id); setEditingCommentBody(c.body) }}
                            aria-label="Edit comment"
                          >
                            Edit
                          </button>
                          <button
                            className="comment-action-btn comment-action-btn--danger"
                            onClick={() => deleteComment(c.id)}
                            aria-label="Delete comment"
                          >
                            Delete
                          </button>
                        </span>
                      )}
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="comment-edit-form">
                        <textarea
                          className="comment-input"
                          value={editingCommentBody}
                          onChange={e => setEditingCommentBody(e.target.value)}
                          rows={2}
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Escape') setEditingCommentId(null)
                          }}
                        />
                        <div className="comment-edit-actions">
                          <button
                            className="btn-ghost"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn-primary"
                            disabled={!editingCommentBody.trim()}
                            onClick={async () => {
                              try {
                                await updateComment(c.id, editingCommentBody.trim())
                                setEditingCommentId(null)
                              } catch (err) {
                                toast.error(err.message || 'Failed to update comment')
                              }
                            }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{c.body}</p>
                    )}
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

      {showManageLabels && (
        <ManageLabelsModal onClose={() => setShowManageLabels(false)} />
      )}
    </>
  )
}
