import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'

const MAX_VISIBLE = 5

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || 'Unknown'
}

function timeAgo(isoString) {
  if (!isoString) return 'Active now'
  const minutes = Math.floor((Date.now() - new Date(isoString).getTime()) / 60_000)
  if (minutes < 2)  return 'Active just now'
  if (minutes < 10) return 'Active a few minutes ago'
  if (minutes < 30) return 'Active about 15 min ago'
  if (minutes < 60) return 'Active about 30 min ago'
  return 'Active over an hour ago'
}

export default function PresenceAvatars({ members = [], present = [] }) {
  const { user }  = useAuth()
  const [openId, setOpenId] = useState(null)
  const wrapRef   = useRef(null)

  useEffect(() => {
    if (!openId) return
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpenId(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openId])

  if (!members.length) return null

  // Merge all members with live presence data
  const enriched = members.map(m => {
    const p    = present.find(u => u.user_id === m.user_id)
    const name = p?.display_name || memberDisplayName(m)
    return {
      user_id:      m.user_id,
      email:        m.email,
      display_name: name,
      avatar_url:   p?.avatar_url ?? null,
      last_seen:    p?.last_seen  ?? null,
      isOnline:     !!p,
    }
  })

  // Online members first, then offline alphabetically
  enriched.sort((a, b) => {
    if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
    return a.display_name.localeCompare(b.display_name)
  })

  const visible  = enriched.slice(0, MAX_VISIBLE)
  const overflow = enriched.length - MAX_VISIBLE

  return (
    <div
      className="presence-avatars"
      ref={wrapRef}
      aria-label={`${members.length} workspace member${members.length !== 1 ? 's' : ''}`}
    >
      {visible.map(u => {
        const isSelf = u.user_id === user?.id
        const isOpen = openId === u.user_id
        return (
          <div
            key={u.user_id}
            className={`presence-avatar-wrap${u.isOnline ? ' presence-avatar-wrap--online' : ''}`}
            onClick={() => setOpenId(isOpen ? null : u.user_id)}
          >
            {u.avatar_url ? (
              <img
                src={u.avatar_url}
                alt={u.display_name}
                className={`presence-avatar presence-avatar--photo${u.isOnline ? '' : ' presence-avatar--offline'}`}
              />
            ) : (
              <div
                className={`presence-avatar${u.isOnline ? '' : ' presence-avatar--offline'}`}
                style={{ background: userColor(u.user_id) }}
                aria-label={u.display_name}
              >
                {getInitials(u.display_name)}
              </div>
            )}

            {isOpen && (
              <div className="presence-tooltip" role="tooltip">
                <span className="presence-tooltip-name">
                  {u.display_name}
                  {isSelf && <span className="presence-tooltip-you"> (you)</span>}
                </span>
                <span className="presence-tooltip-email">{u.email}</span>
                <span className={`presence-tooltip-time${u.isOnline ? ' presence-tooltip-time--online' : ''}`}>
                  {u.isOnline ? timeAgo(u.last_seen) : 'Offline'}
                </span>
              </div>
            )}
          </div>
        )
      })}

      {overflow > 0 && (
        <div
          className="presence-avatar presence-avatar--overflow"
          aria-label={`${overflow} more member${overflow !== 1 ? 's' : ''}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
