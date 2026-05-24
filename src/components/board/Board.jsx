import { useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useAuth } from '../../contexts/AuthContext'
import { useTasks } from '../../hooks/useTasks'
import Sidebar from '../layout/Sidebar'
import Column from './Column'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function Board() {
  const { user } = useAuth()
  // Phase 1: personal workspace — workspace_id equals user.id (created by DB trigger on signup)
  // Phase 2 will add a workspace switcher here
  const workspaceId = user?.id

  const { tasksByStatus, loading, error, addTask, moveTask, deleteTask, updateTask } = useTasks(workspaceId)
  const [showModal, setShowModal] = useState(false)
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }) => {
    const all = Object.values(tasksByStatus).flat()
    setActiveTask(all.find(t => t.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over || active.id === over.id) return

    // Resolve which column the item was dropped into
    const targetColumn =
      COLUMNS.find(c => c.id === over.id)?.id ??
      Object.entries(tasksByStatus).find(([, tasks]) =>
        tasks.some(t => t.id === over.id)
      )?.[0]

    if (targetColumn) moveTask(active.id, targetColumn)
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Delete all tasks? This cannot be undone.')) return
    const all = Object.values(tasksByStatus).flat()
    await Promise.all(all.map(t => deleteTask(t.id)))
  }

  if (loading) return <div className="loading-screen">Loading board…</div>
  if (error)   return <div className="error-screen">Something went wrong: {error}</div>

  return (
    <div className="app-shell">
      <Sidebar onAddTask={() => setShowModal(true)} onDeleteAll={handleDeleteAll} />

      <main className="board-main">
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="board-columns">
            {COLUMNS.map(col => (
              <Column
                key={col.id}
                column={col}
                tasks={tasksByStatus[col.id] ?? []}
                onDelete={deleteTask}
                onUpdate={updateTask}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {showModal && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => { await addTask(data); setShowModal(false) }}
        />
      )}
    </div>
  )
}
