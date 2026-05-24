import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

export default function TaskCard({ task, canEdit = true, onDelete, onUpdate, isDragging = false }) {
  const [editing, setEditing] = useState(false)
  const [text, setText]       = useState(task.text)

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canEdit })

  const style = { transform: CSS.Transform.toString(transform), transition }

  const commitEdit = () => {
    setEditing(false)
    const trimmed = text.trim()
    if (trimmed && trimmed !== task.text) onUpdate(task.id, { text: trimmed })
    else setText(task.text)
  }

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
      {...(canEdit ? { ...attributes, ...listeners } : {})}
    >
      {task.due_date && (
        <span className="task-badge">
          {dayjs(task.due_date).format('MMM D')}
        </span>
      )}

      {editing ? (
        <textarea
          className="task-edit-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={commitEdit}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit() } }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <p
          className="task-text"
          onDoubleClick={() => canEdit && setEditing(true)}
          title={canEdit ? 'Double-click to edit' : undefined}
        >
          {task.text}
        </p>
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
