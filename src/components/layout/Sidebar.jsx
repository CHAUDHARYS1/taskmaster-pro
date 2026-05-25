import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTheme } from '../../contexts/ThemeContext'
import { userColor } from '../../lib/userColor'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import CreateWorkspaceModal from '../workspace/CreateWorkspaceModal'
import ProfileSettingsModal from '../ui/ProfileSettingsModal'

export default function Sidebar({ isOpen, viewMode, onViewChange }) {
  const { user, profile, displayName, signOut } = useAuth()
  const { currentWorkspace }    = useWorkspace()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate   = useNavigate()
  const location   = useLocation()
  const onDashboard = location.pathname === '/dashboard'
  const [showCreate,   setShowCreate]   = useState(false)
  const [showProfile,  setShowProfile]  = useState(false)
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
            <span className="sidebar-dash-icon" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="1" width="5" height="5" rx="1"/>
                <rect x="8" y="1" width="5" height="5" rx="1"/>
                <rect x="1" y="8" width="5" height="5" rx="1"/>
                <rect x="8" y="8" width="5" height="5" rx="1"/>
              </svg>
            </span>
            Dashboard
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
            <span className="sidebar-user-edit" aria-hidden="true">✎</span>
          </button>

          <div className="sidebar-footer-row">
            <button className="btn-ghost theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
              {isDark ? '☀ Light' : '☾ Dark'}
            </button>
            <button className="btn-ghost" onClick={signOut}>Sign out</button>
          </div>

          <p className="sidebar-version">v1.0.01</p>
        </div>
      </aside>

      {showCreate  && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}
      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
