import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { labelMap } from '../../lib/labels'
import { priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'

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
  isDragging = false,
  editingUser = null,   // presence entry of whoever has this task open for editing
}) {
  const isLockedByOther = editingUser != null
  const glowColor = editingUser ? userColor(editingUser.user_id) : null

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canEdit || isLockedByOther })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(glowColor ? { '--editing-color': glowColor } : {}),
  }

  const handleOpen = () => {
    if (isLockedByOther) return
    onOpen(task.id)
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'task-card',
        urgencyClass(task.due_date),
        isSortableDragging      ? 'task-card--dragging' : '',
        isDragging              ? 'task-card--ghost'    : '',
        isLockedByOther         ? 'task-card--locked'   : '',
      ].filter(Boolean).join(' ')}
      onClick={handleOpen}
      {...(canEdit && !isLockedByOther ? { ...attributes, ...listeners } : {})}
    >
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

      {task.description && (
        <p className="task-desc-preview">{task.description}</p>
      )}

      {task.labels?.length > 0 && (
        <div className="task-labels">
          {task.labels.slice(0, 3).map(id => {
            const label = labelMap[id]
            return label ? (
              <span
                key={id}
                className="label-chip label-chip--sm"
                style={{ '--label-color': label.color, '--label-bg': label.bg }}
              >
                {label.name}
              </span>
            ) : null
          })}
          {task.labels.length > 3 && (
            <span className="label-chip label-chip--sm label-chip--overflow">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {task.assignee && (
        <div className="task-card-footer">
          <span className="task-assignee-avatar" title={task.assignee.email}>
            {task.assignee.email.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {canDelete && !isLockedByOther && (
        <button
          className="task-delete"
          aria-label="Delete task"
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        >
          ×
        </button>
      )}
    </li>
  )
}
