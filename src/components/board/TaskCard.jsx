import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { DotsSixVertical, Check, X, ChatCircle } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'
import { stripHtml, truncateText } from '../../utils/text'

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

function initials(u) {
  if (u.display_name) {
    const parts = u.display_name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (u.email ?? '??').split('@')[0].slice(0, 2).toUpperCase()
}

export default function TaskCard({
  task,
  canEdit = true,
  canDelete = false,
  onDelete,
  onOpen,
  onComplete,
  isOverlay = false,
  editingUser = null,
  showProject = false,
}) {
  const { labelMap } = useLabelsCtx()
  const isLockedByOther = editingUser != null
  const glowColor = editingUser ? userColor(editingUser.user_id) : null

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canEdit || isLockedByOther || isOverlay })

  const style = {
    // Overlay card needs no transform — DragOverlay handles positioning itself
    ...(isOverlay ? {} : { transform: CSS.Transform.toString(transform), transition }),
    ...(glowColor ? { '--editing-color': glowColor } : {}),
  }

  const handleOpen = () => {
    if (isLockedByOther) return
    onOpen(task.id)
  }

  return (
    <li
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={[
        'task-card',
        task.status !== 'done' ? urgencyClass(task.due_date) : '',
        task.status === 'done'            ? 'task-card--done'     : '',
        !isOverlay && isSortableDragging  ? 'task-card--dragging' : '',
        isOverlay                         ? 'task-card--ghost'    : '',
        isLockedByOther                   ? 'task-card--locked'   : '',
      ].filter(Boolean).join(' ')}
      onClick={handleOpen}
      {...(!isOverlay && canEdit && !isLockedByOther ? { ...attributes, ...listeners } : {})}
    >
      {canEdit && !isLockedByOther && (
        <DotsSixVertical size={18} className="task-drag-handle" aria-hidden="true" />
      )}

      {isLockedByOther && (
        <div
          className="task-card-editing-badge"
          style={{ background: glowColor }}
          title={`${editingUser.display_name || editingUser.email} is editing this task`}
        >
          {initials(editingUser)}
        </div>
      )}

      <div className="task-card-top">
        {task.priority && (() => {
          const p = priorityMap[task.priority]
          return p ? (
            <span
              className="task-priority-badge"
              style={{ '--p-color': p.color, '--p-bg': p.bg }}
              title={`Priority: ${p.name}`}
            >
              {p.icon} {p.name}
            </span>
          ) : null
        })()}
        {task.due_date && (
          <span className="task-badge">
            {dayjs(task.due_date).format('MMM D')}
          </span>
        )}
      </div>

      <p className="task-text">{task.text}</p>

      {showProject && task.project && (
        <div className="task-project-badge">
          <span className="task-project-dot" style={{ background: task.project.color }} aria-hidden="true" />
          <span className="task-project-name">{task.project.name}</span>
        </div>
      )}

      {task.description && (
        <p className="task-desc-preview">
          {truncateText(stripHtml(task.description))}
        </p>
      )}

      {task.labels?.length > 0 && (
        <div className="task-labels">
          {task.labels.slice(0, 3).map(id => {
            const label = labelMap[id]
            if (!label) return null
            const rgb = `${parseInt(label.color.slice(1,3),16)},${parseInt(label.color.slice(3,5),16)},${parseInt(label.color.slice(5,7),16)}`
            return (
              <span
                key={id}
                className="label-chip label-chip--sm"
                style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
              >
                {label.name}
              </span>
            )
          })}
          {task.labels.length > 3 && (
            <span className="label-chip label-chip--sm label-chip--overflow">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {(task.assignee || Number(task.comments?.[0]?.count ?? 0) > 0) && (
        <div className="task-card-footer">
          {task.assignee && (
            <span
              className="task-assignee-avatar"
              style={{ background: userColor(task.assignee_id), color: '#fff' }}
              title={task.assignee.email}
            >
              {task.assignee.email.slice(0, 2).toUpperCase()}
            </span>
          )}
          {Number(task.comments?.[0]?.count ?? 0) > 0 && (
            <span
              className="task-comment-count"
              title={`${Number(task.comments[0].count)} comment${Number(task.comments[0].count) !== 1 ? 's' : ''}`}
            >
              <ChatCircle size={13} weight="regular" aria-hidden="true" />
              {Number(task.comments[0].count)}
            </span>
          )}
        </div>
      )}

      {(canEdit && onComplete && task.status !== 'done' && !isLockedByOther) || (canDelete && !isLockedByOther) ? (
        <div className="task-card-actions">
          {canEdit && onComplete && task.status !== 'done' && !isLockedByOther && (
            <button
              className="task-complete-btn"
              aria-label="Mark as done"
              title="Mark as done"
              onClick={e => { e.stopPropagation(); onComplete(task.id) }}
            >
              <Check size={13} weight="bold" aria-hidden="true" />
            </button>
          )}
          {canDelete && !isLockedByOther && (
            <button
              className="task-delete"
              aria-label="Delete task"
              title="Delete task"
              onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            >
              <X size={13} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : null}
    </li>
  )
}
