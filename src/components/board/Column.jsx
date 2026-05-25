import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

export default function Column({ column, tasks, canEdit, canDelete, hasFilter, onDelete, onOpen, onComplete, editingMap }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

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
    </div>
  )
}
