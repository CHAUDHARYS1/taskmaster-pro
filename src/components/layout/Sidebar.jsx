import { useAuth } from '../../contexts/AuthContext'

export default function Sidebar({ onAddTask, onDeleteAll }) {
  const { user, signOut } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <h1 className="sidebar-title">Taskmaster Pro</h1>
        <p className="sidebar-user">{user?.email}</p>
      </div>

      <div className="sidebar-actions">
        <button className="btn-primary btn-block" onClick={onAddTask}>
          + Add Task
        </button>
        <button className="btn-danger btn-block" onClick={onDeleteAll}>
          🗑 Delete All Tasks
        </button>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-desc">
          Add a task, drag it across columns as it progresses.
          All changes sync in real time across every open tab and device.
        </p>
        <button className="btn-ghost" onClick={signOut}>Sign out</button>
      </div>
    </aside>
  )
}
