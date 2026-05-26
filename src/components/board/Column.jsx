import { useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

export default function Column({ column, tasks, canEdit, canDelete, hasFilter, onDelete, onOpen, onComplete, editingMap, onQuickAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const [showInput, setShowInput] = useState(false)
  const [text, setText]           = useState('')
  const inputRef                  = useRef(null)

  const openInput = () => {
    setShowInput(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const submit = async () => {
    const trimmed = text.trim()
    setText('')
    if (!trimmed) { setShowInput(false); return }
    await onQuickAdd(trimmed)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setShowInput(false) }
  }

  let emptyText = null
  if (tasks.length === 0) {
    if (hasFilter) emptyText = 'No matches'
    else if (canEdit) emptyText = 'Drop tasks here'
    else emptyText = 'No tasks'
  }

  return (
    <div className={`column column--${column.id} ${isOver && canEdit ? 'column--over' : ''}`}>
      <div className="column-header">
        <span className="column-label">{column.label}</span>
        <span className="column-count">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="column-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              canDelete={canDelete}
              onDelete={onDelete}
              onOpen={onOpen}
              onComplete={onComplete}
              editingUser={editingMap?.[task.id] ?? null}
            />
          ))}
          {emptyText && (
            <li
              className={`column-empty${hasFilter ? ' column-empty--filtered' : ''}`}
              aria-hidden="true"
            >
              {emptyText}
            </li>
          )}
        </ul>
      </SortableContext>

      {onQuickAdd && canEdit && (
        <div className="quick-add">
          {showInput ? (
            <input
              ref={inputRef}
              className="quick-add-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => { if (!text.trim()) setShowInput(false) }}
              placeholder="Task title… Enter to save"
              aria-label="Quick add task"
            />
          ) : (
            <button className="quick-add-btn" onClick={openInput} aria-label="Quick add task">
              + Add task
            </button>
          )}
        </div>
      )}
    </div>
  )
}
