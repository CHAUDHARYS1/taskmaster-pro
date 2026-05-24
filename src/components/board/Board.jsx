import { useEffect, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTasks } from '../../hooks/useTasks'
import { usePresence } from '../../hooks/usePresence'
import Sidebar from '../layout/Sidebar'
import Column from './Column'
import TaskCard from './TaskCard'
import AddTaskModal from './AddTaskModal'
import PresenceAvatars from './PresenceAvatars'
import TaskDetailPanel from './TaskDetailPanel'

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function Board() {
  const { currentWorkspace, userRole, loading: wsLoading } = useWorkspace()
  const canEdit = userRole !== 'viewer'

  const { tasksByStatus, loading, error, addTask, moveTask, deleteTask, updateTask } =
    useTasks(currentWorkspace?.id)

  const present = usePresence(currentWorkspace?.id)

  const [showModal, setShowModal]       = useState(false)
  const [activeTask, setActiveTask]     = useState(null)
  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const allTasks    = Object.values(tasksByStatus).flat()
  const selectedTask = allTasks.find(t => t.id === selectedTaskId) ?? null

  // Close panel if selected task is deleted
  useEffect(() => {
    if (selectedTaskId && !selectedTask) setSelectedTaskId(null)
  }, [selectedTaskId, selectedTask])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = ({ active }) => {
    if (!canEdit) return
    const all = Object.values(tasksByStatus).flat()
    setActiveTask(all.find(t => t.id === active.id) ?? null)
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!canEdit || !over || active.id === over.id) return

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

  if (wsLoading || loading) return <div className="loading-screen">Loading board…</div>
  if (error)                 return <div className="error-screen">Error: {error}</div>

  return (
    <div className="app-shell">
      <Sidebar onAddTask={() => setShowModal(true)} onDeleteAll={handleDeleteAll} />

      <main className="board-main">
        <div className="board-header">
          <span className="board-header-title">{currentWorkspace?.name}</span>
          <PresenceAvatars users={present} />
        </div>

        {userRole === 'viewer' && (
          <div className="viewer-banner">
            You have view-only access to this workspace.
          </div>
        )}

        <div className="board-columns-wrap">
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="board-columns">
              {COLUMNS.map(col => (
                <Column
                  key={col.id}
                  column={col}
                  tasks={tasksByStatus[col.id] ?? []}
                  canEdit={canEdit}
                  onDelete={deleteTask}
                  onOpen={setSelectedTaskId}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={null}>
              {activeTask ? <TaskCard task={activeTask} isDragging canEdit={canEdit} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {showModal && canEdit && (
        <AddTaskModal
          onClose={() => setShowModal(false)}
          onSave={async (data) => { await addTask(data); setShowModal(false) }}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          canEdit={canEdit}
          onUpdate={updateTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  )
}
