import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useMembers } from '../../hooks/useMembers'

const ROLE_LABELS = { owner: 'Owner', member: 'Member', viewer: 'Viewer' }

export default function MembersList() {
  const { user }                          = useAuth()
  const { currentWorkspace, userRole }    = useWorkspace()
  const { members, loading, removeMember } = useMembers(currentWorkspace?.id)

  if (loading || members.length === 0) return null

  const handleRemove = async (memberId) => {
    if (!window.confirm('Remove this member from the workspace?')) return
    try { await removeMember(memberId) } catch (err) { alert(err.message) }
  }

  return (
    <div className="members-list">
      <p className="members-label">Members</p>
      <ul className="members-ul">
        {members.map(m => (
          <li key={m.user_id} className="member-row">
            <span className="member-avatar">{m.email.charAt(0).toUpperCase()}</span>
            <div className="member-info">
              <span className="member-email">
                {m.email} {m.user_id === user?.id && <span className="member-you">(you)</span>}
              </span>
              <span className="member-role">{ROLE_LABELS[m.role]}</span>
            </div>
            {userRole === 'owner' && m.user_id !== user?.id && (
              <button
                className="member-remove"
                onClick={() => handleRemove(m.user_id)}
                aria-label={`Remove ${m.email}`}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
