import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePanelResize } from '../../hooks/usePanelResize'
import { X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { fmtDateFull, fmtTimeStr, fmtCommentDate } from '../../utils/format'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useTaskDetail } from '../../hooks/useTaskDetail'
import { useTaskChecklist } from '../../hooks/useTaskChecklist'
import { supabase } from '../../lib/supabase'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import ManageLabelsModal from '../workspace/ManageLabelsModal'
import TiptapEditor from '../ui/TiptapEditor'
import { PRIORITIES } from '../../lib/priority'
import TaskDocumentLink from './TaskDocumentLink'
import DocDrawer from '../ui/DocDrawer'

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

export default function TaskDetailPanel({ task, columns = DEFAULT_STATUS_OPTIONS, canEdit, autoSave = true, onUpdate, onChecklistChange, onClose }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { currentWorkspace, workspaceTemplate } = useWorkspace()
  const { toast } = useToast()
  const { labels, labelMap } = useLabelsCtx()
  const { comments, loading: commentsLoading, addComment, deleteComment, updateComment } = useTaskDetail(task.id)
  const { items: checklistItems, addItem: addChecklistItem, updateItem: updateChecklistItem, deleteItem: deleteChecklistItem } = useTaskChecklist(task.id)
  const { width, startResize } = usePanelResize()

  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')
  const isCustomDate = task.due_date && ![today, tomorrow, nextWeek].includes(task.due_date)

  const [title,              setTitle]              = useState(task.text)
  const [description,        setDescription]        = useState(() => toHtml(task.description ?? ''))
  const [commentBody,        setCommentBody]        = useState('')
  const [editingCommentId,   setEditingCommentId]   = useState(null)
  const [editingCommentBody, setEditingCommentBody] = useState('')
  const [submitting,         setSubmitting]         = useState(false)
  const [members,            setMembers]            = useState([])
  const [showManageLabels,   setShowManageLabels]   = useState(false)
  const [newItemText,        setNewItemText]        = useState('')
  const [drawerDocId,        setDrawerDocId]        = useState(null)
  const [closing,            setClosing]            = useState(false)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 220)
  }

  const commentInputRef = useRef(null)
  const titleRef        = useRef(null)

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [title])

  useEffect(() => { setTitle(task.text) },                         [task.text])
  useEffect(() => { setDescription(toHtml(task.description ?? '')) }, [task.description])

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
    handleClose()
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
      <aside
        className={`task-panel${closing ? ' task-panel--closing' : ''}`}
        style={{ width: `${Math.min(width, window.innerWidth)}px` }}
        role="complementary"
        aria-label="Task detail"
      >
        <div className="task-panel-resize" onMouseDown={startResize} aria-hidden="true" title="Drag to resize" />

        {/* ── Header ──────────────────────────────────────── */}
        <div className="atp-hdr">
          <span className="atp-hdr__label">Task</span>
          <div className="atp-hdr__actions">
            <button className="modal-close" onClick={handleClose} aria-label="Close panel">
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────── */}
        <div className="atp-body">

          {/* Title */}
          <label className="atp-field-label" htmlFor="tdp-title-input">Title</label>
          {canEdit ? (
            <textarea
              id="tdp-title-input"
              ref={titleRef}
              className="atp-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur() } }}
              aria-label="Task title"
              rows={1}
            />
          ) : (
            <p className="atp-title atp-title--ro">{task.text}</p>
          )}

          {/* Description */}
          <span className="atp-field-label">Description</span>
          <div className="atp-desc-editor">
            <TiptapEditor
              content={description}
              onChange={setDescription}
              onBlur={saveDescription}
              editable={canEdit}
            />
          </div>

          <div className="atp-divider" aria-hidden="true" />

          {/* ── Properties ──────────────────────────────── */}
          <div className="atp-props" role="group" aria-label="Task properties">

            {/* Column */}
            <div className="atp-prop">
              <label className="atp-prop__label" htmlFor="tdp-status">Column</label>
              <div className="atp-prop__val">
                {canEdit ? (
                  <select
                    id="tdp-status"
                    className="atp-select"
                    value={task.status}
                    onChange={e => onUpdate(task.id, { status: e.target.value })}
                    aria-label="Task status"
                  >
                    {columns.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className="atp-prop-ro">
                    {columns.find(s => s.id === task.status)?.label ?? task.status}
                  </span>
                )}
              </div>
            </div>

            {/* Priority */}
            <div className="atp-prop atp-prop--wrap">
              <span className="atp-prop__label" id="tdp-priority-label">Priority</span>
              <div className="atp-prop__val" role="group" aria-labelledby="tdp-priority-label">
                <div className="atp-pill-row">
                  {PRIORITIES.map(p => {
                    const active = task.priority === p.id
                    return canEdit ? (
                      <button
                        key={p.id}
                        type="button"
                        className={`atp-pill${active ? ' atp-pill--active' : ''}`}
                        style={{ '--p-color': p.color, '--p-bg': p.bg }}
                        onClick={() => onUpdate(task.id, { priority: active ? null : p.id })}
                        aria-pressed={active}
                        title={active ? `Clear ${p.name}` : p.name}
                      >
                        <span aria-hidden="true">{p.icon}</span>
                        {p.name}
                      </button>
                    ) : active ? (
                      <span
                        key={p.id}
                        className="atp-pill atp-pill--active"
                        style={{ '--p-color': p.color, '--p-bg': p.bg }}
                      >
                        <span aria-hidden="true">{p.icon}</span>
                        {p.name}
                      </span>
                    ) : null
                  })}
                  {!task.priority && !canEdit && (
                    <span className="task-panel-empty">No priority.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Due date */}
            <div className="atp-prop atp-prop--wrap">
              <span className="atp-prop__label" id="tdp-due-label">Due date</span>
              <div className="atp-prop__val" role="group" aria-labelledby="tdp-due-label">
                {canEdit ? (
                  <>
                    <div className="atp-pill-row">
                      <button type="button" className={`atp-pill${task.due_date === today    ? ' atp-pill--active' : ''}`} onClick={() => onUpdate(task.id, { due_date: today })}    aria-pressed={task.due_date === today}>Today</button>
                      <button type="button" className={`atp-pill${task.due_date === tomorrow ? ' atp-pill--active' : ''}`} onClick={() => onUpdate(task.id, { due_date: tomorrow })} aria-pressed={task.due_date === tomorrow}>Tomorrow</button>
                      <button type="button" className={`atp-pill${task.due_date === nextWeek ? ' atp-pill--active' : ''}`} onClick={() => onUpdate(task.id, { due_date: nextWeek })} aria-pressed={task.due_date === nextWeek}>Next week</button>
                      <button type="button" className={`atp-pill${!task.due_date          ? ' atp-pill--active' : ''}`} onClick={() => onUpdate(task.id, { due_date: null, due_time: null })} aria-pressed={!task.due_date}>None</button>
                      {isCustomDate && (
                        <span className="atp-pill atp-pill--active" style={{ '--p-color': 'var(--accent)', '--p-bg': 'var(--accent-tint)' }}>
                          {dayjs(task.due_date).format('MMM D')}
                        </span>
                      )}
                    </div>
                    <div className="atp-date-row">
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
                          type="button"
                          className="due-date-clear"
                          onClick={() => onUpdate(task.id, { due_date: null, due_time: null })}
                          aria-label="Clear due date"
                        >
                          <X size={14} weight="bold" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="atp-prop-ro">
                    {task.due_date
                      ? `${fmtDateFull(task.due_date)}${task.due_time ? ` at ${fmtTimeStr(task.due_time)}` : ''}`
                      : <span className="task-panel-empty">No due date.</span>
                    }
                  </span>
                )}
              </div>
            </div>

            {/* Assignee */}
            {workspaceTemplate !== 'job-tracker' && (
              <div className="atp-prop">
                <label className="atp-prop__label" htmlFor="tdp-assignee">Assignee</label>
                <div className="atp-prop__val">
                  {canEdit ? (
                    <select
                      id="tdp-assignee"
                      className="atp-select"
                      value={task.assignee_id ?? ''}
                      onChange={e => onUpdate(task.id, { assignee_id: e.target.value || null })}
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.user_id} value={m.user_id}>{memberDisplayName(m)}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="atp-prop-ro">
                      {task.assignee
                        ? memberDisplayName(task.assignee)
                        : <span className="task-panel-empty">Unassigned</span>
                      }
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Labels */}
            <div className="atp-prop atp-prop--wrap">
              <span className="atp-prop__label" id="tdp-labels-label">Labels</span>
              <div className="atp-prop__val" role="group" aria-labelledby="tdp-labels-label">
                <div className="atp-pill-row">
                  {labels.length === 0 && canEdit && (
                    <button className="label-create-hint" onClick={() => setShowManageLabels(true)}>
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
                        type="button"
                        className={`label-chip${active ? ' label-chip--active' : ''}`}
                        style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
                        onClick={() => {
                          const current = task.labels ?? []
                          const next = active ? current.filter(l => l !== label.id) : [...current, label.id]
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
                {canEdit && labels.length > 0 && (
                  <button
                    className="atp-manage-link"
                    onClick={() => setShowManageLabels(true)}
                    title="Manage labels"
                  >
                    Manage labels
                  </button>
                )}
              </div>
            </div>

          </div>{/* /atp-props */}

          {/* ── Checklist ────────────────────────────────── */}
          <div className="atp-section">
            <div className="atp-section__hdr">
              <span className="atp-prop__label">
                Checklist
                {checklistItems.length > 0 && (
                  <span className="task-panel-count">
                    {checklistItems.filter(i => i.checked).length}/{checklistItems.length}
                  </span>
                )}
              </span>
            </div>

            {checklistItems.length > 0 && (
              <div
                className="checklist-progress"
                style={{ '--progress-pct': `${Math.round((checklistItems.filter(i => i.checked).length / checklistItems.length) * 100)}%` }}
                aria-label={`${checklistItems.filter(i => i.checked).length} of ${checklistItems.length} items complete`}
              />
            )}

            <ul className="checklist-list">
              {checklistItems.map(item => (
                <li key={item.id} className="checklist-item">
                  <input
                    type="checkbox"
                    id={`chk-${item.id}`}
                    checked={item.checked}
                    onChange={() => {
                      if (!canEdit) return
                      const newChecked = !item.checked
                      updateChecklistItem(item.id, { checked: newChecked })
                      onChecklistChange?.(task.id, items => items.map(i => i.id === item.id ? { ...i, checked: newChecked } : i))
                    }}
                    disabled={!canEdit}
                    aria-label={item.text}
                  />
                  <label
                    htmlFor={`chk-${item.id}`}
                    className={`checklist-item__text${item.checked ? ' checklist-item__text--done' : ''}`}
                  >
                    {item.text}
                  </label>
                  {canEdit && (
                    <button
                      className="checklist-item__delete"
                      onClick={() => {
                        deleteChecklistItem(item.id)
                        onChecklistChange?.(task.id, items => items.filter(i => i.id !== item.id))
                      }}
                      aria-label="Delete checklist item"
                      title="Delete item"
                    >
                      <X size={13} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {!canEdit && checklistItems.length === 0 && (
              <span className="task-panel-empty">No checklist items.</span>
            )}

            {canEdit && (
              <form
                className="checklist-add-row"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!newItemText.trim()) return
                  try {
                    const newItem = await addChecklistItem(newItemText)
                    setNewItemText('')
                    if (newItem) onChecklistChange?.(task.id, items => [...items, { id: newItem.id, checked: false }])
                  } catch (err) {
                    toast.error(err.message || 'Failed to add item')
                  }
                }}
              >
                <input
                  type="text"
                  className="checklist-add-input"
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  placeholder="Add an item…"
                  aria-label="New checklist item"
                />
                <button type="submit" className="btn-primary checklist-add-btn" disabled={!newItemText.trim()}>
                  Add
                </button>
              </form>
            )}
          </div>

          {/* ── Document link ────────────────────────────── */}
          <div className="atp-section">
            <TaskDocumentLink
              taskId={task.id}
              workspaceId={task.workspace_id}
              onOpenDoc={setDrawerDocId}
            />
          </div>

          {/* ── Activity ─────────────────────────────────── */}
          <div className="atp-section">
            <div className="atp-section__hdr">
              <span className="atp-prop__label">
                Activity
                {!commentsLoading && comments.length > 0 && (
                  <span className="task-panel-count">{comments.length}</span>
                )}
              </span>
            </div>

            <div className="task-panel-activity">
              <div className="activity-item activity-item--created">
                <span className="activity-dot" />
                <span className="activity-text">
                  Task created {fmtDateFull(task.created_at)}
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
                        {fmtCommentDate(c.created_at)}
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
                          onKeyDown={e => { if (e.key === 'Escape') setEditingCommentId(null) }}
                        />
                        <div className="comment-edit-actions">
                          <button className="btn-ghost" onClick={() => setEditingCommentId(null)}>Cancel</button>
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
                <label htmlFor="tdp-comment-input" className="sr-only">Add a comment</label>
                <textarea
                  ref={commentInputRef}
                  id="tdp-comment-input"
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
                  <button type="submit" className="btn-primary" disabled={!commentBody.trim() || submitting}>
                    {submitting ? 'Saving…' : 'Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>{/* /atp-body */}

        {hasPending && (
          <div className="task-panel-ftr">
            <button className="btn-primary task-panel-save-btn" onClick={handleSave}>Save</button>
          </div>
        )}
      </aside>

      {showManageLabels && (
        <ManageLabelsModal onClose={() => setShowManageLabels(false)} />
      )}

      {drawerDocId && (
        <DocDrawer
          docId={drawerDocId}
          workspaceId={task.workspace_id}
          onClose={() => setDrawerDocId(null)}
          onOpenFull={() => { navigate('/writes/' + drawerDocId); setDrawerDocId(null); handleClose() }}
        />
      )}
    </>
  )
}
