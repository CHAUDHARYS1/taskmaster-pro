import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useTheme } from '../../contexts/ThemeContext'
import { userColor } from '../../lib/userColor'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import MembersList from '../workspace/MembersList'
import InviteModal from '../workspace/InviteModal'
import ProfileSettingsModal from '../ui/ProfileSettingsModal'

export default function Sidebar({ isOpen }) {
  const { user, displayName, signOut } = useAuth()
  const { currentWorkspace, userRole }  = useWorkspace()
  const { isDark, toggle: toggleTheme } = useTheme()
  const [showInvite, setShowInvite]       = useState(false)
  const [showProfile, setShowProfile]     = useState(false)

  const canEdit = userRole !== 'viewer'

  const avatarColor   = user ? userColor(user.id) : 'var(--accent)'
  const avatarInitial = displayName ? displayName[0].toUpperCase() : '?'

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <h1 className="sidebar-title">Taskmaster Pro</h1>
        </div>

        <WorkspaceSwitcher />

        <MembersList />

        <div className="sidebar-footer">
          {canEdit && (
            <button className="btn-ghost sidebar-invite-btn" onClick={() => setShowInvite(true)}>
              + Invite members
            </button>
          )}

          <button
            className="sidebar-user-row"
            onClick={() => setShowProfile(true)}
            title="Edit profile"
          >
            <span
              className="sidebar-user-avatar"
              style={{ background: avatarColor }}
              aria-hidden="true"
            >
              {avatarInitial}
            </span>
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

      {showInvite   && <InviteModal onClose={() => setShowInvite(false)} />}
      {showProfile  && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </>
  )
}
