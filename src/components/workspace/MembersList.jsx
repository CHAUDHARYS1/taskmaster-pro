import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useMembers } from '../../hooks/useMembers'
import { useToast } from '../../contexts/ToastContext'

const ROLE_LABELS = { owner: 'Owner', member: 'Member', viewer: 'Viewer' }

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}

function memberInitial(m) {
  if (m.first_name) return m.first_name[0].toUpperCase()
  return (m.email ?? '?')[0].toUpperCase()
}

export default function MembersList() {
  const { user }                            = useAuth()
  const { currentWorkspace, userRole }      = useWorkspace()
  const { members, loading, removeMember }  = useMembers(currentWorkspace?.id)
  const { toast } = useToast()

  if (loading || members.length === 0) return null

  const handleRemove = async (m) => {
    if (!window.confirm(`Remove ${memberDisplayName(m)} from the workspace?`)) return
    try {
      await removeMember(m.user_id)
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  return (
    <div className="members-list">
      <p className="members-label">Members</p>
      <ul className="members-ul">
        {members.map(m => (
          <li key={m.user_id} className="member-row">
            <span className="member-avatar">{memberInitial(m)}</span>
            <div className="member-info">
              <span className="member-email">
                {memberDisplayName(m)}{m.user_id === user?.id && <span className="member-you"> (you)</span>}
              </span>
              <span className="member-role">{ROLE_LABELS[m.role]}</span>
            </div>
            {userRole === 'owner' && m.user_id !== user?.id && (
              <button
                className="member-remove"
                onClick={() => handleRemove(m)}
                aria-label={`Remove ${memberDisplayName(m)}`}
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
