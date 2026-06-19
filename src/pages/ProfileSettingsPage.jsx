import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Camera, CheckCircle, Check,
  Lock, DeviceMobile, SignOut, CaretRight,
  SquaresFour, CalendarBlank, ChartPieSlice,
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { userColor } from '../lib/userColor'

const AVATAR_COLORS = [
  '#6366f1', '#2563EB', '#0ea5e9', '#0f766e',
  '#22c55e', '#d97706', '#ef4444', '#ec4899',
  '#7c3aed', '#555555',
]

// ── Toggle ────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id, label }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      className={`settings-toggle${checked ? ' settings-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle__thumb" aria-hidden="true" />
    </button>
  )
}

// ── Segmented control ─────────────────────────────────────────────────────
function Seg({ options, value, onChange }) {
  return (
    <div className="psp-seg" role="group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`psp-seg-btn${value === opt.value ? ' psp-seg-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function ProfileSettingsPage() {
  const navigate = useNavigate()
  const { profile, user, updateProfile, uploadAvatar, prefs, updatePrefs, signOut, displayName } = useAuth()
  const { toast } = useToast()
  const { themeMode, setThemeMode } = useTheme()

  // form state
  const [fullName,   setFullName]   = useState('')
  const [title,      setTitle]      = useState('')
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [savedAt,    setSavedAt]    = useState(null)

  const fileRef = useRef(null)

  // initialise from profile
  useEffect(() => {
    if (!profile) return
    const first = profile.first_name ?? ''
    const last  = profile.last_name  ?? ''
    setFullName([first, last].filter(Boolean).join(' '))
    setTitle(prefs.jobTitle ?? '')
    setAvatarPreview(profile.avatar_url ?? null)
  }, [profile?.first_name, profile?.last_name, profile?.avatar_url])

  useEffect(() => {
    setTitle(prefs.jobTitle ?? '')
  }, [prefs.jobTitle])

  const markSaved = () => {
    setSavedAt(Date.now())
    setTimeout(() => setSavedAt(null), 3000)
  }

  // ── Avatar upload ─────────────────────────────────────────────────────
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Image must be under 2 MB');   return }
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      await uploadAvatar(file)
      markSaved()
    } catch (err) {
      setAvatarPreview(profile?.avatar_url ?? null)
      toast.error(err.message || 'Failed to upload avatar')
    } finally { setUploading(false) }
  }

  // ── Save profile details ──────────────────────────────────────────────
  const handleSaveDetails = async () => {
    const trimmed = fullName.trim()
    const parts   = trimmed.split(/\s+/)
    const first   = parts[0] ?? ''
    const last    = parts.slice(1).join(' ')
    setSaving(true)
    try {
      await updateProfile({ first_name: first, last_name: last })
      await updatePrefs({ jobTitle: title.trim() })
      markSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDetailsBlur = () => {
    if (
      fullName.trim() !== [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      title.trim() !== (prefs.jobTitle ?? '')
    ) {
      handleSaveDetails()
    }
  }

  // ── Avatar color ──────────────────────────────────────────────────────
  const activeColor = prefs.avatarColor || userColor(user?.id ?? '')

  const handleColorPick = async (color) => {
    try {
      await updatePrefs({ avatarColor: color })
      markSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to save color')
    }
  }

  // ── Prefs ─────────────────────────────────────────────────────────────
  const savePref = async (patch) => {
    try {
      await updatePrefs(patch)
      markSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to save preference')
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut()
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const initial = (profile?.first_name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase()
  const heroColor = prefs.avatarColor || userColor(user?.id ?? '')

  return (
    <div className="psp">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="psp-hdr">
        <button
          className="psp-hdr-back"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <div className="psp-hdr-title-wrap">
          <span className="psp-hdr-title">Profile</span>
          <span className="psp-hdr-email">{user?.email}</span>
        </div>
        <div className="psp-hdr-saved" aria-live="polite">
          {savedAt != null && (
            <>
              <CheckCircle size={15} weight="fill" aria-hidden="true" />
              Saved
            </>
          )}
        </div>
      </header>

      <div className="psp-scroll">
        {/* ── Avatar hero ──────────────────────────────────────── */}
        <div className="psp-hero">
          <button
            type="button"
            className="psp-avatar-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="Profile photo" className="psp-avatar-img" />
              : <span className="psp-avatar-initials" style={{ background: heroColor }}>{initial}</span>
            }
            <span className="psp-avatar-overlay" aria-hidden="true">
              <Camera size={18} weight="bold" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="avatar-file-input"
            onChange={handleAvatarChange}
            aria-label="Choose profile photo"
          />
          <div className="psp-hero-info">
            <span className="psp-hero-name">{displayName || 'No name set'}</span>
            {prefs.jobTitle && <span className="psp-hero-role">{prefs.jobTitle}</span>}
          </div>
        </div>

        {/* ── YOUR DETAILS ──────────────────────────────────────── */}
        <p className="psp-section-label">Your details</p>
        <div className="psp-card">
          <div className="psp-field">
            <label className="psp-field-label" htmlFor="psp-fullname">Full name</label>
            <input
              id="psp-fullname"
              type="text"
              className="psp-field-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              onBlur={handleDetailsBlur}
              placeholder="Your name…"
              disabled={saving}
            />
          </div>

          <div className="psp-field-divider" />

          <div className="psp-field">
            <label className="psp-field-label" htmlFor="psp-email">Email</label>
            <input
              id="psp-email"
              type="email"
              className="psp-field-input psp-field-input--disabled"
              value={user?.email ?? ''}
              readOnly
            />
          </div>

          <div className="psp-field-divider" />

          <div className="psp-field">
            <label className="psp-field-label" htmlFor="psp-title">
              Title <span className="psp-field-optional">· Optional</span>
            </label>
            <input
              id="psp-title"
              type="text"
              className="psp-field-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              onBlur={handleDetailsBlur}
              placeholder="e.g. Product designer"
              disabled={saving}
            />
          </div>

          <div className="psp-field-divider" />

          <div className="psp-field psp-field--color">
            <span className="psp-field-label">Avatar color</span>
            <div className="psp-swatches" role="group" aria-label="Avatar color">
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`psp-swatch${activeColor === c ? ' psp-swatch--active' : ''}`}
                  style={{ background: c }}
                  onClick={() => handleColorPick(c)}
                  aria-label={`Color ${c}`}
                  aria-pressed={activeColor === c}
                >
                  {activeColor === c && <Check size={13} weight="bold" color="#fff" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── PREFERENCES ───────────────────────────────────────── */}
        <p className="psp-section-label">Preferences</p>
        <div className="psp-card">
          <div className="psp-pref-row">
            <span className="psp-field-label">Theme</span>
            <Seg
              value={themeMode}
              onChange={v => setThemeMode(v)}
              options={[
                { value: 'light',  label: 'Light'  },
                { value: 'dark',   label: 'Dark'   },
                { value: 'system', label: 'System' },
              ]}
            />
          </div>

          <div className="psp-field-divider" />

          <div className="psp-pref-row">
            <span className="psp-field-label">Default view</span>
            <Seg
              value={prefs.defaultView}
              onChange={v => savePref({ defaultView: v })}
              options={[
                { value: 'board',     label: 'Board'     },
                { value: 'calendar',  label: 'Calendar'  },
                { value: 'dashboard', label: 'Dashboard' },
              ]}
            />
          </div>
        </div>

        {/* ── NOTIFICATIONS ─────────────────────────────────────── */}
        <p className="psp-section-label">Notifications</p>
        <div className="psp-card">
          {[
            { id: 'notifMentions',    label: 'Mentions & comments',    hint: 'When someone @mentions or replies to you.' },
            { id: 'notifAssignments', label: 'Task assignments',       hint: 'When a task is assigned to you.' },
            { id: 'inAppReminders',   label: 'Due-date reminders',     hint: 'A nudge the day a task is due.' },
            { id: 'emailReminders',   label: 'Weekly digest email',    hint: 'A Monday summary of what\'s ahead.' },
          ].map((item, i, arr) => (
            <>
              <div key={item.id} className="psp-notif-row">
                <label htmlFor={`psp-toggle-${item.id}`} className="psp-notif-info">
                  <span className="psp-notif-label">{item.label}</span>
                  <span className="psp-notif-hint">{item.hint}</span>
                </label>
                <Toggle
                  id={`psp-toggle-${item.id}`}
                  label={item.label}
                  checked={prefs[item.id] ?? true}
                  onChange={v => savePref({ [item.id]: v })}
                />
              </div>
              {i < arr.length - 1 && <div className="psp-field-divider" />}
            </>
          ))}
        </div>

        {/* ── ACCOUNT ───────────────────────────────────────────── */}
        <p className="psp-section-label">Account</p>
        <div className="psp-card psp-card--rows">
          <button type="button" className="psp-account-row">
            <span className="psp-account-icon" aria-hidden="true">
              <Lock size={18} weight="regular" />
            </span>
            <div className="psp-account-info">
              <span className="psp-account-label">Change password</span>
              <span className="psp-account-sub">Update your login password</span>
            </div>
            <CaretRight size={16} weight="bold" className="psp-account-caret" aria-hidden="true" />
          </button>

          <div className="psp-field-divider" />

          <button type="button" className="psp-account-row">
            <span className="psp-account-icon" aria-hidden="true">
              <DeviceMobile size={18} weight="regular" />
            </span>
            <div className="psp-account-info">
              <span className="psp-account-label">Active sessions</span>
              <span className="psp-account-sub">Manage where you're signed in</span>
            </div>
            <CaretRight size={16} weight="bold" className="psp-account-caret" aria-hidden="true" />
          </button>
        </div>

        {/* ── Sign out ──────────────────────────────────────────── */}
        <button
          type="button"
          className="psp-signout-btn"
          onClick={handleSignOut}
        >
          <SignOut size={18} weight="regular" aria-hidden="true" />
          Sign out
        </button>

        {/* ── Footer ───────────────────────────────────────────── */}
        <p className="psp-footer">
          Taskmaster Pro · Signed in as {user?.email}
        </p>
      </div>
    </div>
  )
}
