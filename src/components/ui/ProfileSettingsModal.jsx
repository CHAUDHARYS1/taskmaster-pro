import { useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { userColor } from '../../lib/userColor'

export default function ProfileSettingsModal({ onClose }) {
  const { profile, user, updateProfile, uploadAvatar } = useAuth()
  const { toast } = useToast()

  const [firstName,    setFirstName]    = useState(profile?.first_name ?? '')
  const [lastName,     setLastName]     = useState(profile?.last_name  ?? '')
  const [saving,       setSaving]       = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? null)
  const [uploading,    setUploading]    = useState(false)

  const fileInputRef = useRef(null)

  const displayInitial = firstName
    ? firstName[0].toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB')
      return
    }
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)
    setUploading(true)
    try {
      await uploadAvatar(file)
      toast.success('Avatar updated')
    } catch (err) {
      setAvatarPreview(profile?.avatar_url ?? null)
      toast.error(err.message || 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

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

        <div className="modal-body">
          {/* Avatar */}
          <div className="avatar-upload-wrap">
            <button
              type="button"
              className="avatar-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              aria-label="Upload profile picture"
              title="Click to upload a photo"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile picture"
                  className="avatar-upload-img"
                />
              ) : (
                <span
                  className="avatar-upload-initials"
                  style={{ background: userColor(user?.id ?? '') }}
                >
                  {displayInitial}
                </span>
              )}
              <span className="avatar-upload-overlay" aria-hidden="true">
                {uploading ? '…' : '📷'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="avatar-file-input"
              onChange={handleAvatarChange}
              aria-label="Choose profile picture"
            />
            <p className="avatar-upload-hint">Click to upload · Max 2 MB</p>
          </div>

          <form id="profile-form" onSubmit={handleSubmit}>
            <div className="auth-name-row">
              <div className="field-block">
                <label htmlFor="prof-first">First name</label>
                <input
                  id="prof-first"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
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
          </form>
        </div>

        <div className="modal-ftr">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="profile-form" className="btn-primary" disabled={saving || uploading}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
