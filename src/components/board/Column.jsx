import { memo, useRef, useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import TaskCard from './TaskCard'

function Column({ column, tasks, canEdit, canDelete, hasFilter, onDelete, onOpen, onComplete, editingMap, onQuickAdd, showProject }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const [text, setText] = useState('')
  const [desc, setDesc] = useState('')
  const inputRef = useRef(null)

  const showDesc = text.length > 0

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    setDesc('')
    await onQuickAdd(trimmed, desc.trim() || null)
    inputRef.current?.focus()
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setDesc('') }
  }

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setDesc('') }
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

      {onQuickAdd && canEdit && (
        <div className="quick-add quick-add--top">
          <div className="quick-add-title-row">
            <input
              ref={inputRef}
              className="quick-add-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Add a task…"
              aria-label="Quick add task title"
            />
            <button
              className="quick-add-submit"
              onClick={submit}
              disabled={!text.trim()}
              aria-label="Submit task"
              title="Add task"
            >
              <PaperPlaneTilt size={15} weight="fill" aria-hidden="true" />
            </button>
          </div>

          <div className={`quick-add-desc-wrap${showDesc ? ' quick-add-desc-wrap--open' : ''}`}>
            <div className="quick-add-desc-inner">
              <textarea
                className="quick-add-desc"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                onKeyDown={handleDescKeyDown}
                placeholder="Add a description… (optional)"
                rows={2}
                aria-label="Quick add task description"
              />
            </div>
          </div>
        </div>
      )}

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
              showProject={showProject}
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
    </div>
  )
}

export default memo(Column)
