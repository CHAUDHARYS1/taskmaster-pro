import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

export default function Column({ column, tasks, canEdit, onDelete, onOpen }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={`column ${isOver && canEdit ? 'column--over' : ''}`}>
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
              onDelete={onDelete}
              onOpen={onOpen}
            />
          ))}
          {tasks.length === 0 && (
            <li className="column-empty" aria-hidden="true">
              {canEdit ? 'Drop tasks here' : 'No tasks'}
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  )
}
