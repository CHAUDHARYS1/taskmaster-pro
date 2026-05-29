import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SquaresFour, PencilSimple, Gear, Coffee, SignOut, Keyboard, NotePencil, CalendarBlank } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { userColor } from '../../lib/userColor'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
import ProfileSettingsModal from '../ui/ProfileSettingsModal'
import GlobalSettingsModal from '../ui/GlobalSettingsModal'
import BugReportSheet from '../ui/BugReportSheet'
import QuickLinks from '../ui/QuickLinks'

export default function Sidebar({ isOpen, viewMode, onViewChange, onShowShortcuts }) {
  const { user, profile, displayName, signOut } = useAuth()
  const { currentWorkspace }    = useWorkspace()
  const navigate   = useNavigate()
  const location   = useLocation()
  const onDashboard = location.pathname === '/dashboard'
  const onCalendar  = location.pathname === '/calendar'
  const onWrites    = location.pathname.startsWith('/writes')
  const [showCreate,    setShowCreate]    = useState(false)
  const [showProfile,   setShowProfile]   = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const [showBugReport, setShowBugReport] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(true)

  useEffect(() => { setProjectsOpen(true) }, [currentWorkspace?.id])

  const avatarColor   = user ? userColor(user.id) : 'var(--accent)'
  const avatarInitial = displayName ? displayName[0].toUpperCase() : '?'

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <h1 className="sidebar-title">Taskmaster Pro</h1>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-dash-btn${onDashboard ? ' sidebar-dash-btn--active' : ''}`}
            onClick={() => navigate(onDashboard ? '/' : '/dashboard')}
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
          <button
            className="sidebar-user-row"
            onClick={() => setShowProfile(true)}
            title="Edit profile"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="sidebar-user-avatar sidebar-user-avatar--photo"
              />
            ) : (
              <span
                className="sidebar-user-avatar"
                style={{ background: avatarColor }}
                aria-hidden="true"
              >
                {avatarInitial}
              </span>
            )}
            <span className="sidebar-user-name" title={user?.email}>
              {displayName || user?.email}
            </span>
            <PencilSimple size={18} className="sidebar-user-edit" aria-hidden="true" />
          </button>

          <div className="sidebar-footer-row">
            <button className="btn-ghost sidebar-settings-btn" onClick={onShowShortcuts} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)">
              <Keyboard size={18} aria-hidden="true" />
            </button>
            <button className="btn-ghost sidebar-settings-btn" onClick={() => setShowSettings(true)} aria-label="Settings" title="Settings">
              <Gear size={18} aria-hidden="true" />
            </button>
            <button className="btn-ghost sidebar-signout-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <SignOut size={18} aria-hidden="true" />
            </button>
            <QuickLinks />
          </div>

          <p className="sidebar-version">v1.0.01</p>
          <p className="sidebar-credit">
            Designed and built by{' '}
            <a href="https://chaudharys1.netlify.app" target="_blank" rel="noreferrer" className="sidebar-credit-link">
              SC Design and Consultation
            </a>
          </p>
          <a
            href="https://buymeacoffee.com/schaudhary"
            target="_blank"
            rel="noreferrer"
            className="sidebar-coffee-btn"
            aria-label="Buy me a coffee"
          >
            <Coffee size={14} weight="bold" aria-hidden="true" />
            Buy me a coffee
          </a>
        </div>
      </aside>

      {showCreate   && <CreateWorkspaceModal  onClose={() => setShowCreate(false)} />}
      {showProfile  && <ProfileSettingsModal  onClose={() => setShowProfile(false)} />}
      {showSettings && <GlobalSettingsModal   onClose={() => setShowSettings(false)} onBugReport={() => { setShowSettings(false); setShowBugReport(true) }} />}
      {showBugReport && <BugReportSheet onClose={() => setShowBugReport(false)} />}
    </>
  )
}
