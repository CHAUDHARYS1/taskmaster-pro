import { useState } from 'react'
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

function timeAgo(isoString) {
  if (!isoString) return 'Active now'
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60_000)
  if (minutes < 2)  return 'Active just now'
  if (minutes < 10) return 'Active a few minutes ago'
  if (minutes < 30) return 'Active about 15 minutes ago'
  if (minutes < 60) return 'Active about 30 minutes ago'
  return 'Active over an hour ago'
}

export default function PresenceAvatars({ users }) {
  const { user } = useAuth()
  const [tooltip, setTooltip] = useState(null) // { userId, x, y }

  if (!users || users.length < 2) return null

  const visible  = users.slice(0, MAX_VISIBLE)
  const overflow = users.length - MAX_VISIBLE
  const tooltipUser = tooltip ? users.find(u => u.user_id === tooltip.userId) : null

  return (
    <div className="presence-avatars" aria-label={`${users.length} people viewing`}>
      {visible.map(u => {
        const isSelf = u.user_id === user?.id
        return (
          <div
            key={u.user_id}
            className="presence-avatar-wrap"
            onMouseEnter={() => setTooltip({ userId: u.user_id })}
            onMouseLeave={() => setTooltip(null)}
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.display_name || u.email}
                className="presence-avatar presence-avatar--photo"
              />
            ) : (
              <div
                className="presence-avatar"
                style={{ background: userColor(u.user_id) }}
                aria-label={u.display_name || u.email}
              >
                {initials(u)}
              </div>
            )}

            {tooltip?.userId === u.user_id && (
              <div className="presence-tooltip" role="tooltip">
                <span className="presence-tooltip-name">
                  {u.display_name || u.email.split('@')[0]}
                  {isSelf && <span className="presence-tooltip-you"> (you)</span>}
                </span>
                <span className="presence-tooltip-email">{u.email}</span>
                <span className="presence-tooltip-time">{timeAgo(u.last_seen)}</span>
              </div>
            )}
          </div>
        )
      })}

      {overflow > 0 && (
        <div className="presence-avatar presence-avatar--overflow" aria-label={`${overflow} more people`}>
          +{overflow}
        </div>
      )}

      {/* Tooltip for tooltipUser rendered outside the loop for overflow case if needed */}
    </div>
  )
}
