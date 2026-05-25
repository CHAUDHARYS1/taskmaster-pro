import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import WorkspaceSwitcher from '../workspace/WorkspaceSwitcher'
import MembersList from '../workspace/MembersList'
import InviteModal from '../workspace/InviteModal'

export default function Sidebar({ isOpen, onAddTask, onDeleteAll }) {
  const { signOut }          = useAuth()
  const { currentWorkspace, userRole } = useWorkspace()
  const [showInvite, setShowInvite]    = useState(false)

  const canEdit = userRole !== 'viewer'

  return (
    <>
      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        {/* App title */}
        <div className="sidebar-top">
          <h1 className="sidebar-title">Taskmaster Pro</h1>
        </div>

        {/* Workspace switcher */}
        <WorkspaceSwitcher />

        {/* Board actions — hidden for viewers */}
        {canEdit && (
          <div className="sidebar-actions">
            <button className="btn-primary btn-block" onClick={onAddTask}>
              + Add Task
            </button>
            <button className="btn-danger btn-block" onClick={onDeleteAll}>
              🗑 Delete All Tasks
            </button>
          </div>
        )}

        {/* Members list */}
        <MembersList />

        {/* Invite + sign out */}
        <div className="sidebar-footer">
          {canEdit && (
            <button className="btn-ghost sidebar-invite-btn" onClick={() => setShowInvite(true)}>
              + Invite members
            </button>
          )}
          <button className="btn-ghost" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
    </>
  )
}
