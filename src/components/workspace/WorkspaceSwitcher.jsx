import { useNavigate, useLocation } from 'react-router-dom'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import ProjectSwitcher from './ProjectSwitcher'

export default function WorkspaceSwitcher({ projectsOpen, onToggleProjects, viewMode, onViewChange }) {
  const { user } = useAuth()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const navigate  = useNavigate()
  const location  = useLocation()

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
                    if (location.pathname === '/dashboard') navigate('/')
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

              {/* Projects nested directly inside the active workspace item */}
              {isActive && (
                <div
                  key={ws.id}
                  className={`project-panel${projectsOpen ? '' : ' project-panel--closed'}`}
                  aria-hidden={!projectsOpen}
                >
                  <ProjectSwitcher viewMode={viewMode} onViewChange={onViewChange} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
