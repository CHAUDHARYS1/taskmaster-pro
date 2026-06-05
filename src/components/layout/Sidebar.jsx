import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SquaresFour, NotePencil, CalendarBlank, Archive } from '@phosphor-icons/react'
import LogoLockup from '../ui/LogoLockup'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'

export default function Sidebar({ isOpen, viewMode, onViewChange }) {
  const { currentWorkspace }    = useWorkspace()
  const navigate   = useNavigate()
  const location   = useLocation()
  const onDashboard = location.pathname === '/dashboard'
  const onCalendar  = location.pathname === '/calendar'
  const onWrites    = location.pathname.startsWith('/writes')
  const onArchive   = location.pathname === '/archive'
  const [showCreate,    setShowCreate]    = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => { setProjectsOpen(true) }, [currentWorkspace?.id])

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`} aria-label="Sidebar navigation">
        <div className="sidebar-top">
          <LogoLockup width={164} className="sidebar-lockup" />
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-dash-btn${onDashboard ? ' sidebar-dash-btn--active' : ''}`}
            onClick={() => navigate(onDashboard ? '/app' : '/dashboard')}
            aria-pressed={onDashboard}
          >
            <SquaresFour size={18} className="sidebar-dash-icon" aria-hidden="true" />
            Dashboard
          </button>

          <button
            className={`sidebar-dash-btn${onCalendar ? ' sidebar-dash-btn--active' : ''}`}
            onClick={() => navigate('/calendar')}
            aria-pressed={onCalendar}
          >
            <CalendarBlank size={18} className="sidebar-dash-icon" aria-hidden="true" />
            Calendar
          </button>

          <button
            className={`sidebar-dash-btn${onWrites ? ' sidebar-dash-btn--active' : ''}`}
            onClick={() => navigate('/writes')}
            aria-pressed={onWrites}
          >
            <NotePencil size={18} className="sidebar-dash-icon" aria-hidden="true" />
            Writes
          </button>

          <button
            className={`sidebar-dash-btn${onArchive ? ' sidebar-dash-btn--active' : ''}`}
            onClick={() => navigate('/archive')}
            aria-pressed={onArchive}
          >
            <Archive size={18} className="sidebar-dash-icon" aria-hidden="true" />
            Archive
          </button>

          <WorkspaceSwitcher
            projectsOpen={projectsOpen}
            onToggleProjects={() => setProjectsOpen(p => !p)}
            viewMode={viewMode}
            onViewChange={onViewChange}
          />
        </div>

        <button className="btn-ghost ws-new-btn" onClick={() => setShowCreate(true)}>
          + New workspace
        </button>

        <div className="sidebar-footer">
          <p className="sidebar-version">v1.2.00</p>
          <p className="sidebar-credit">
            Designed and built by{' '}
            <a href="https://scdesigns.netlify.app/" target="_blank" rel="noreferrer" className="sidebar-credit-link">
              SC Design and Consultation
            </a>
          </p>
        </div>
      </aside>

      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
