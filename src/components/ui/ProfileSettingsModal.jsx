import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

export default function ProfileSettingsModal({ onClose }) {
  const { profile, user, updateProfile } = useAuth()
  const { toast } = useToast()

  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName,  setLastName]  = useState(profile?.last_name  ?? '')
  const [saving, setSaving]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
      toast.success('Profile updated')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Profile settings"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Profile settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="auth-name-row">
              <div className="field-block">
                <label htmlFor="prof-first">First name</label>
                <input
                  id="prof-first"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoFocus
                />
              </div>
              <div className="field-block">
                <label htmlFor="prof-last">Last name</label>
                <input
                  id="prof-last"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="field-block">
              <label>Email</label>
              <input type="email" value={user?.email ?? ''} disabled className="field-disabled" />
            </div>
          </div>

          <div className="modal-ftr">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
