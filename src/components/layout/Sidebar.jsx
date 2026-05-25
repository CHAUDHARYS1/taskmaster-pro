import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTheme } from '../../contexts/ThemeContext'
import { userColor } from '../../lib/userColor'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import ProjectSwitcher from '../workspace/ProjectSwitcher'
import ProfileSettingsModal from '../ui/ProfileSettingsModal'

export default function Sidebar({ isOpen, viewMode, onViewChange }) {
  const { user, profile, displayName, signOut } = useAuth()
  const { currentWorkspace }    = useWorkspace()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [showProfile, setShowProfile]   = useState(false)

  const avatarColor   = user ? userColor(user.id) : 'var(--accent)'
  const avatarInitial = displayName ? displayName[0].toUpperCase() : '?'

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <h1 className="sidebar-title">Taskmaster Pro</h1>
        </div>

        <WorkspaceSwitcher />

        {currentWorkspace && (
          <ProjectSwitcher viewMode={viewMode} onViewChange={onViewChange} />
        )}

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

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
