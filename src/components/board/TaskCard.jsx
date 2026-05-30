import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { DotsSixVertical, Check, X, ChatCircle, CheckSquare, Square } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
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

function TaskCard({
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
        <div
          className="task-desc-preview"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      {task.task_checklist_items?.length > 0 && (() => {
        const sorted  = [...task.task_checklist_items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        const visible  = sorted.slice(0, 3)
        const overflow = sorted.length - visible.length
        return (
          <ul className="card-checklist">
            {visible.map(item => (
              <li key={item.id} className={`card-checklist-item${item.checked ? ' card-checklist-item--done' : ''}`}>
                {item.checked
                  ? <CheckSquare size={12} weight="fill" className="card-checklist-icon card-checklist-icon--checked" aria-hidden="true" />
                  : <Square      size={12} weight="regular" className="card-checklist-icon" aria-hidden="true" />
                }
                <span className="card-checklist-text">{item.text}</span>
              </li>
            ))}
            {overflow > 0 && (
              <li className="card-checklist-more">+{overflow} more</li>
            )}
          </ul>
        )
      })()}

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

      {(() => {
        const checklistTotal = task.task_checklist_items?.length ?? 0
        const checklistDone  = task.task_checklist_items?.filter(i => i.checked).length ?? 0
        const commentCount   = Number(task.comments?.[0]?.count ?? 0)
        const hasFooter      = task.assignee || commentCount > 0 || checklistTotal > 0
        if (!hasFooter) return null
        return (
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
            {checklistTotal > 0 && (
              <span
                className="task-checklist-count"
                title={`${checklistDone} of ${checklistTotal} checklist item${checklistTotal !== 1 ? 's' : ''} done`}
              >
                <CheckSquare size={13} weight="regular" aria-hidden="true" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {commentCount > 0 && (
              <span
                className="task-comment-count"
                title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
              >
                <ChatCircle size={13} weight="regular" aria-hidden="true" />
                {commentCount}
              </span>
            )}
          </div>
        )
      })()}

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

export default memo(TaskCard)
