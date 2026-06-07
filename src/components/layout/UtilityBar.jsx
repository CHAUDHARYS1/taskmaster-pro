import { Coffee } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'

export default function UtilityBar({ onProfileClick }) {
  const { user, profile, displayName } = useAuth()

  const avatar = profile?.avatar_url
    ? <img src={profile.avatar_url} alt="" className="utility-bar-avatar utility-bar-avatar--photo" />
    : <span className="utility-bar-avatar" style={{ background: userColor(user?.id) }} aria-hidden="true">
        {displayName ? displayName[0].toUpperCase() : '?'}
      </span>

  return (
    <div className="utility-bar">
      {onProfileClick ? (
        <button
          className="utility-bar-profile"
          onClick={onProfileClick}
          aria-label={`Edit profile for ${displayName || user?.email}`}
        >
          {avatar}
          <span className="utility-bar-name">{displayName || user?.email}</span>
        </button>
      ) : (
        <div className="utility-bar-profile utility-bar-profile--static" aria-label={`Signed in as ${displayName || user?.email}`}>
          {avatar}
          <span className="utility-bar-name">{displayName || user?.email}</span>
        </div>
      )}

      <div className="utility-bar-actions">
        <a
          href="https://buymeacoffee.com/schaudhary"
          target="_blank"
          rel="noreferrer"
          className="utility-bar-btn"
          aria-label="Buy me a coffee"
          data-tooltip="Buy me a coffee"
        >
          <Coffee size={14} weight="bold" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}
