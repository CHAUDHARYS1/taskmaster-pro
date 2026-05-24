import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'

export default function Column({ column, tasks, onDelete, onUpdate }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={`column ${isOver ? 'column--over' : ''}`}>
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
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
          {tasks.length === 0 && (
            <li className="column-empty" aria-hidden="true">Drop tasks here</li>
          )}
        </ul>
      </SortableContext>
    </div>
  )
}
