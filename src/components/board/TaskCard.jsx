import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { labelMap } from '../../lib/labels'
import { priorityMap } from '../../lib/priority'

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

export default function TaskCard({ task, canEdit = true, onDelete, onOpen, isDragging = false }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canEdit })

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        'task-card',
        urgencyClass(task.due_date),
        isSortableDragging ? 'task-card--dragging' : '',
        isDragging         ? 'task-card--ghost'    : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onOpen(task.id)}
      {...(canEdit ? { ...attributes, ...listeners } : {})}
    >
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

      {canEdit && (
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
