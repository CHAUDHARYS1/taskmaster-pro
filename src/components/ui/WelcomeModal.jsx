import { X } from '@phosphor-icons/react'

export default function WelcomeModal({ workspaceName, invitedByName, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet welcome-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Welcome to workspace"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} weight="bold" aria-hidden="true" /></button>

        <div className="welcome-modal-body">
          <div className="welcome-modal-icon" aria-hidden="true">🎉</div>
          <h2 className="welcome-modal-title">Welcome to {workspaceName}!</h2>
          {invitedByName && (
            <p className="welcome-modal-sub">You were invited by {invitedByName}</p>
          )}
          <button className="btn-primary welcome-modal-cta" onClick={onClose}>
            Go to board
          </button>
        </div>
      </div>
    </div>
  )
}
