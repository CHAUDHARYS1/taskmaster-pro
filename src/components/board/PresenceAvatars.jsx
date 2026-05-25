import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'

const MAX_VISIBLE = 4

function initials(u) {
  if (u.display_name) {
    const parts = u.display_name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return u.email.split('@')[0].slice(0, 2).toUpperCase()
}

export default function PresenceAvatars({ users }) {
  const { user } = useAuth()

  if (!users || users.length < 2) return null

  const visible  = users.slice(0, MAX_VISIBLE)
  const overflow = users.length - MAX_VISIBLE

  return (
    <div className="presence-avatars" aria-label={`${users.length} people viewing`}>
      {visible.map(u => (
        <div
          key={u.user_id}
          className="presence-avatar"
          style={{ background: userColor(u.user_id) }}
          title={u.user_id === user?.id
            ? `${u.display_name || u.email} (you)`
            : (u.display_name || u.email)
          }
        >
          {initials(u)}
        </div>
      ))}
      {overflow > 0 && (
        <div className="presence-avatar presence-avatar--overflow" title={`${overflow} more`}>
          +{overflow}
        </div>
      )}
    </div>
  )
}
