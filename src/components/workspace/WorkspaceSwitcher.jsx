import { useNavigate, useLocation } from 'react-router-dom'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import ProjectSwitcher from './ProjectSwitcher'

const LinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 9a3 3 0 0 0 4.243.121l1.5-1.5a3 3 0 0 0-4.243-4.242l-.86.859"/>
    <path d="M9 7a3 3 0 0 0-4.243-.121l-1.5 1.5a3 3 0 0 0 4.243 4.242l.859-.86"/>
  </svg>
)

export default function WorkspaceSwitcher({ projectsOpen, onToggleProjects, viewMode, onViewChange }) {
  const { user }   = useAuth()
  const { workspaces, currentWorkspace, switchWorkspace } = useWorkspace()
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const location   = useLocation()

  const copyWorkspaceLink = (ws) => {
    navigator.clipboard.writeText(`${window.location.origin}/workspace/${ws.id}`)
    toast.success('Link copied')
  }

  return (
    <div className="ws-switcher">
      <p className="ws-switcher-label">Workspaces</p>

      <ul className="ws-list">
        {workspaces.map(ws => {
          const isActive   = currentWorkspace?.id === ws.id
          const isPersonal = ws.id === user?.id
          return (
            <li key={ws.id} className="ws-list-item">
              <div className="ws-item-row">
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
                <button
                  className="ws-link-btn"
                  onClick={() => copyWorkspaceLink(ws)}
                  title="Copy workspace link"
                  aria-label="Copy workspace link"
                >
                  <LinkIcon />
                </button>
              </div>

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
