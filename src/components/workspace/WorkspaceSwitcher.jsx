import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import CreateWorkspaceModal from './CreateWorkspaceModal'

export default function WorkspaceSwitcher() {
  const { user } = useAuth()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <div className="ws-switcher">
        <p className="ws-switcher-label">Workspaces</p>

        <ul className="ws-list">
          {workspaces.map(ws => {
            const isActive   = currentWorkspace?.id === ws.id
            const isPersonal = ws.id === user?.id
            return (
              <li key={ws.id} className="ws-list-item">
                <button
                  className={`ws-item ${isActive ? 'ws-item--active' : ''}`}
                  onClick={() => switchWorkspace(ws)}
                >
                  <span className="ws-avatar">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="ws-name">
                    {isPersonal ? 'My Workspace' : ws.name}
                  </span>
                  {isActive && <span className="ws-check">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>

        <button className="btn-ghost ws-new-btn" onClick={() => setShowCreate(true)}>
          + New workspace
        </button>
      </div>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
