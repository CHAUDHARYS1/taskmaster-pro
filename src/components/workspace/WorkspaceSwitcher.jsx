import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'
import { Link, CaretDown } from '@phosphor-icons/react'
import { useToast } from '../../contexts/ToastContext'
import ProjectSwitcher from './ProjectSwitcher'

// Mounts with --closed so the stagger always plays, even on workspace switch
function ProjectPanel({ projectsOpen, viewMode, onViewChange }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div
      className={`project-panel${(!ready || !projectsOpen) ? ' project-panel--closed' : ''}`}
      aria-hidden={!projectsOpen}
    >
      <div className="project-panel-inner">
        <ProjectSwitcher viewMode={viewMode} onViewChange={onViewChange} />
      </div>
    </div>
  )
}

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
          const isActive   = currentWorkspace?.id === ws.id && location.pathname !== '/dashboard' && location.pathname !== '/calendar' && !location.pathname.startsWith('/writes')
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
                      if (location.pathname === '/dashboard' || location.pathname === '/calendar' || location.pathname.startsWith('/writes')) navigate('/')
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
                    <CaretDown
                      size={16}
                      className={`ws-chevron${projectsOpen ? ' ws-chevron--open' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>
                <button
                  className="ws-link-btn"
                  onClick={() => copyWorkspaceLink(ws)}
                  title="Copy workspace link"
                  aria-label="Copy workspace link"
                >
                  <Link size={16} aria-hidden="true" />
                </button>
              </div>

              {/* Projects nested directly inside the active workspace item */}
              {isActive && (
                <ProjectPanel
                  projectsOpen={projectsOpen}
                  viewMode={viewMode}
                  onViewChange={onViewChange}
                />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
