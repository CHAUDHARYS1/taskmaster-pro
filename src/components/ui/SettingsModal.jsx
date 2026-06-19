import { useRef, useState } from 'react'
import { X, Camera, SquaresFour, List, CalendarBlank, Cards, Rows, Clock, CalendarDot, Sun, Moon, ArrowsOut } from '@phosphor-icons/react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { useTheme } from '../../contexts/ThemeContext'
import { userColor } from '../../lib/userColor'

const TABS = [
  { id: 'account',       label: 'Account' },
  { id: 'preferences',   label: 'Preferences' },
  { id: 'notifications', label: 'Notifications' },
]

// ── Toggle switch ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      className={`settings-toggle${checked ? ' settings-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-toggle__thumb" aria-hidden="true" />
    </button>
  )
}

// ── Segmented control helper ──────────────────────────────────────────────
function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="settings-seg" role="group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`settings-seg__btn${value === opt.value ? ' settings-seg__btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Preference row ────────────────────────────────────────────────────────
function PrefRow({ label, hint, children }) {
  return (
    <div className="settings-pref-row">
      <div className="settings-pref-info">
        <span className="settings-pref-label">{label}</span>
        {hint && <span className="settings-pref-hint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ── Account tab ───────────────────────────────────────────────────────────
function AccountTab({ onClose }) {
  const { profile, user, updateProfile, uploadAvatar } = useAuth()
  const { showToast } = useToast()

  const [firstName,     setFirstName]     = useState(profile?.first_name ?? '')
  const [lastName,      setLastName]      = useState(profile?.last_name  ?? '')
  const [saving,        setSaving]        = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? null)
  const [uploading,     setUploading]     = useState(false)

  const fileInputRef = useRef(null)

  const displayInitial = firstName
    ? firstName[0].toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return }
    if (file.size > 2 * 1024 * 1024)    { showToast('Image must be under 2 MB', 'error');   return }
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      await uploadAvatar(file)
      showToast('Avatar updated', 'success')
    } catch (err) {
      setAvatarPreview(profile?.avatar_url ?? null)
      showToast(err.message || 'Failed to upload avatar', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ first_name: firstName.trim(), last_name: lastName.trim() })
      showToast('Profile updated', 'success')
      onClose()
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
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
              <img src={avatarPreview} alt="Profile picture" className="avatar-upload-img" />
            ) : (
              <span className="avatar-upload-initials" style={{ background: userColor(user?.id ?? '') }}>
                {displayInitial}
              </span>
            )}
            <span className="avatar-upload-overlay" aria-hidden="true">
              {uploading ? '…' : <Camera size={22} />}
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

        <form id="settings-account-form" onSubmit={handleSubmit}>
          <div className="auth-name-row">
            <div className="field-block">
              <label htmlFor="sett-first">First name</label>
              <input id="sett-first" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane…" />
            </div>
            <div className="field-block">
              <label htmlFor="sett-last">Last name</label>
              <input id="sett-last" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith…" />
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
        <button type="submit" form="settings-account-form" className="btn-primary" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </>
  )
}

// ── Preferences tab ───────────────────────────────────────────────────────
function PreferencesTab() {
  const { prefs, updatePrefs } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const { showToast } = useToast()

  const save = async (patch) => {
    try {
      await updatePrefs(patch)
    } catch (err) {
      showToast(err.message || 'Failed to save preference', 'error')
    }
  }

  return (
    <div className="modal-body settings-prefs-body">
      <PrefRow
        label="Theme"
        hint="Switch between light and dark interface."
      >
        <SegmentedControl
          value={isDark ? 'dark' : 'light'}
          onChange={v => { if ((v === 'dark') !== isDark) toggleTheme() }}
          options={[
            { value: 'light', label: 'Light', icon: <Sun  size={13} weight="bold" /> },
            { value: 'dark',  label: 'Dark',  icon: <Moon size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>

      <PrefRow
        label="Default view"
        hint="The view mode loaded when you open a project."
      >
        <SegmentedControl
          value={prefs.defaultView}
          onChange={v => save({ defaultView: v })}
          options={[
            { value: 'board',    label: 'Board',    icon: <SquaresFour size={13} weight="bold" /> },
            { value: 'list',     label: 'List',     icon: <List        size={13} weight="bold" /> },
            { value: 'calendar', label: 'Calendar', icon: <CalendarBlank size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>

      <PrefRow
        label="Card density"
        hint="Compact hides descriptions. Expanded shows full content and checklist."
      >
        <SegmentedControl
          value={prefs.cardDensity}
          onChange={v => save({ cardDensity: v })}
          options={[
            { value: 'compact',     label: 'Compact',     icon: <Rows      size={13} weight="bold" /> },
            { value: 'comfortable', label: 'Default',     icon: <Cards     size={13} weight="bold" /> },
            { value: 'expanded',    label: 'Expanded',    icon: <ArrowsOut size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>

      <PrefRow
        label="Date format"
        hint='Relative: "2d", "Today". Absolute: "Jun 7".'
      >
        <SegmentedControl
          value={prefs.dateFormat}
          onChange={v => save({ dateFormat: v })}
          options={[
            { value: 'relative', label: 'Relative', icon: <Clock       size={13} weight="bold" /> },
            { value: 'absolute', label: 'Absolute', icon: <CalendarDot size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>

      <PrefRow
        label="Week starts on"
        hint="Affects the Gantt and Calendar views."
      >
        <SegmentedControl
          value={String(prefs.weekStart)}
          onChange={v => save({ weekStart: Number(v) })}
          options={[
            { value: '1', label: 'Monday' },
            { value: '0', label: 'Sunday' },
          ]}
        />
      </PrefRow>

      <p className="settings-prefs-autosave">Changes save automatically.</p>
    </div>
  )
}

// ── Notifications tab ─────────────────────────────────────────────────────
function NotificationsTab() {
  const { prefs, updatePrefs } = useAuth()
  const { showToast } = useToast()

  const save = async (patch) => {
    try {
      await updatePrefs(patch)
    } catch (err) {
      showToast(err.message || 'Failed to save preference', 'error')
    }
  }

  return (
    <div className="modal-body settings-prefs-body">
      <div className="settings-notif-group">
        <p className="settings-notif-group-label">In-app</p>

        <div className="settings-notif-row">
          <label htmlFor="toggle-inapp" className="settings-notif-info">
            <span className="settings-pref-label">Due-time reminders</span>
            <span className="settings-pref-hint">
              Toast notification when a task with a set time is approaching.
            </span>
          </label>
          <Toggle
            id="toggle-inapp"
            checked={prefs.inAppReminders}
            onChange={v => save({ inAppReminders: v })}
          />
        </div>
      </div>

      <div className="settings-notif-group">
        <p className="settings-notif-group-label">Email</p>

        <div className="settings-notif-row">
          <label htmlFor="toggle-email" className="settings-notif-info">
            <span className="settings-pref-label">Due-date digest</span>
            <span className="settings-pref-hint">
              Email the day before tasks in your workspaces are due.
            </span>
          </label>
          <Toggle
            id="toggle-email"
            checked={prefs.emailReminders}
            onChange={v => save({ emailReminders: v })}
          />
        </div>
      </div>

      <p className="settings-prefs-autosave">Changes save automatically.</p>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────
export default function SettingsModal({ onClose, initialTab = 'account' }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet settings-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="settings-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'account'       && <AccountTab       onClose={onClose} />}
        {activeTab === 'preferences'   && <PreferencesTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
      </div>
    </div>
  )
}
