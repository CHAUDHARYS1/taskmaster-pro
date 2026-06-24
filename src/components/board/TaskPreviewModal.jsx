import { useEffect, useRef, useCallback } from 'react'
import { X, PencilSimple } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'

function assigneeDisplayName(u) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return full || u.display_name || u.email?.split('@')[0] || '?'
}

function initials(u) {
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || u.display_name || ''
  if (name) {
    const parts = name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (u.email ?? '??').split('@')[0].slice(0, 2).toUpperCase()
}

export default function TaskPreviewModal({ task, columns = [], onClose, onEdit }) {
  const { labelMap } = useLabelsCtx()
  const { currentWorkspace } = useWorkspace()
  const dialogRef = useRef(null)

  const checklistTotal = task.task_checklist_items?.length ?? 0
  const checklistDone  = task.task_checklist_items?.filter(i => i.checked).length ?? 0
  const progressPct    = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0

  const col         = columns.find(c => c.id === task.status)
  const statusLabel = col?.label ?? task.status
  const statusColor = col?.color ?? ({ toDo: '#94a3b8', inProgress: '#f59e0b', inReview: '#3b82f6', done: '#22c55e' }[task.status] ?? 'var(--ink-4)')
  const priorityDef = task.priority ? priorityMap[task.priority] : null

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [onClose])

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleEdit = useCallback(() => {
    onClose()
    onEdit?.(task.id)
  }, [onClose, onEdit, task.id])

  return (
    <div
      className="tpm-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="tpm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={task.text}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="tpm-hdr">
          <div className="tpm-hdr-left">
            <span className="tpm-status-pill" style={{ '--s-color': statusColor }}>
              <span className="tpm-status-dot" aria-hidden="true" />
              {statusLabel.toUpperCase()}
            </span>
          </div>
          <div className="tpm-hdr-center">
            {currentWorkspace && (
              <span className="tpm-ws-chip">
                <span
                  className="tpm-ws-sq"
                  style={{ background: currentWorkspace.color ?? 'var(--accent)' }}
                  aria-hidden="true"
                >
                  {currentWorkspace.emoji || currentWorkspace.name.charAt(0).toUpperCase()}
                </span>
                <span className="tpm-ws-name">{currentWorkspace.name.toUpperCase()}</span>
              </span>
            )}
          </div>
          <div className="tpm-hdr-right">
            {onEdit && (
              <button className="tpm-edit-btn" onClick={handleEdit}>
                <PencilSimple size={13} weight="bold" aria-hidden="true" />
                Edit
              </button>
            )}
            <button className="modal-close" onClick={onClose} aria-label="Close preview">
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="tpm-body">
          {/* Priority + labels — reuse existing chip classes for visual consistency */}
          {(priorityDef || (task.labels?.length ?? 0) > 0) && (
            <div className="tpm-badges">
              {priorityDef && (
                <span className="task-priority-chip" style={{ '--p-color': priorityDef.color }}>
                  <span aria-hidden="true">{priorityDef.icon}</span>
                  {priorityDef.name}
                </span>
              )}
              {task.labels?.map(id => {
                const label = labelMap[id]
                if (!label) return null
                const [r, g, b] = [1, 3, 5].map(i => parseInt(label.color.slice(i, i + 2), 16))
                return (
                  <span
                    key={id}
                    className="label-chip"
                    style={{ '--label-color': label.color, '--label-bg': `rgba(${r},${g},${b},0.12)` }}
                  >
                    {label.name}
                  </span>
                )
              })}
            </div>
          )}

          {/* Title */}
          <h1 className="tpm-title">{task.text}</h1>

          {/* Due date + Assignee */}
          <div className="tpm-meta-grid">
            <div className="tpm-meta-item">
              <span className="tpm-meta-label">DUE DATE</span>
              {task.due_date ? (
                <span className="tpm-meta-value">
                  {dayjs(task.due_date).format('MMM D, YYYY')}
                </span>
              ) : (
                <span className="tpm-meta-value tpm-meta-value--empty">No due date</span>
              )}
            </div>
            <div className="tpm-meta-item">
              <span className="tpm-meta-label">ASSIGNEE</span>
              {task.assignee ? (
                <span className="tpm-meta-value">
                  <span
                    className="tpm-assignee-avatar"
                    style={{ background: userColor(task.assignee_id) }}
                    aria-hidden="true"
                  >
                    {initials(task.assignee)}
                  </span>
                  {assigneeDisplayName(task.assignee)}
                </span>
              ) : (
                <span className="tpm-meta-value tpm-meta-value--empty">Unassigned</span>
              )}
            </div>
          </div>

          {/* Thin divider separating meta from content sections */}
          <hr className="tpm-divider" aria-hidden="true" />

          {/* Description */}
          {task.description && (
            <div className="tpm-section">
              <span className="tpm-section-label">DESCRIPTION</span>
              <div
                className="tpm-desc"
                dangerouslySetInnerHTML={{ __html: task.description }}
              />
            </div>
          )}

          {/* Checklist */}
          {checklistTotal > 0 && (
            <div className="tpm-section">
              <div className="tpm-checklist-hdr">
                <span className="tpm-section-label">CHECKLIST</span>
                <div className="tpm-checklist-progress-wrap">
                  <div className="tpm-checklist-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
                    <span className="tpm-checklist-fill" style={{ width: `${progressPct}%` }} />
                  </div>
                  <span className="tpm-checklist-count">{checklistDone}/{checklistTotal}</span>
                </div>
              </div>
              <ul className="tpm-checklist">
                {task.task_checklist_items
                  .slice()
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map(item => (
                    <li
                      key={item.id}
                      className={`tpm-checklist-item${item.checked ? ' tpm-checklist-item--done' : ''}`}
                    >
                      <span
                        className={`tpm-checklist-box${item.checked ? ' tpm-checklist-box--checked' : ''}`}
                        aria-hidden="true"
                      />
                      <span className="tpm-checklist-text">{item.text}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Hint footer */}
        <div className="tpm-hint" aria-hidden="true">
          Click to preview · Double-click to edit · Esc to close
        </div>
      </div>
    </div>
  )
}
