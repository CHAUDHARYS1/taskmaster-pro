import { useAuth } from '../../contexts/AuthContext'

const COLORS = ['#2563EB', '#15803d', '#7c3aed', '#c2410c', '#be185d', '#0f766e']
const MAX_VISIBLE = 4

function colorFor(email) {
  let hash = 0
  for (const ch of email) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initials(email) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
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
          style={{ background: colorFor(u.email) }}
          title={u.user_id === user?.id ? `${u.email} (you)` : u.email}
        >
          {initials(u.email)}
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
