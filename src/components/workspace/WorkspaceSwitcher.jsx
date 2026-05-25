import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'

export default function WorkspaceSwitcher({ projectsOpen, onToggleProjects }) {
  const { user } = useAuth()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()

  return (
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
                onClick={() => {
                  if (isActive) {
                    onToggleProjects?.()
                  } else {
                    switchWorkspace(ws)
                  }
                }}
              >
                <span className="ws-avatar">
                  {ws.name.charAt(0).toUpperCase()}
                </span>
                <span className="ws-name">
                  {isPersonal ? 'My Workspace' : ws.name}
                </span>
                {isActive && (
                  <span
                    className={`ws-chevron${projectsOpen ? ' ws-chevron--open' : ''}`}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
