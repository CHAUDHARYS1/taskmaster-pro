import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CaretRight, Camera,
  Sun, Moon, Desktop, SquaresFour, List, CalendarBlank,
  Cards, Rows, ArrowsOut, Clock, CalendarDot,
} from '@phosphor-icons/react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { useTheme } from '../contexts/ThemeContext'
import { userColor } from '../lib/userColor'

// ── Shared sub-components ─────────────────────────────────────────────────

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

// ── Account view ──────────────────────────────────────────────────────────

function AccountView() {
  const { profile, user, updateProfile, uploadAvatar } = useAuth()
  const { toast } = useToast()

  const [firstName,     setFirstName]     = useState(profile?.first_name ?? '')
  const [lastName,      setLastName]      = useState(profile?.last_name  ?? '')
  const [saving,        setSaving]        = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url ?? null)
  const [uploading,     setUploading]     = useState(false)

  const fileRef = useRef(null)
  const initial = firstName
    ? firstName[0].toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024)    { toast.error('Image must be under 2 MB');   return }
    setAvatarPreview(URL.createObjectURL(file))
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
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="spage-body">
      {/* Avatar */}
      <div className="spage-avatar-wrap">
        <button
          type="button"
          className="avatar-upload-btn"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Upload profile picture"
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="Profile picture" className="avatar-upload-img" />
            : <span className="avatar-upload-initials" style={{ background: userColor(user?.id ?? '') }}>{initial}</span>
          }
          <span className="avatar-upload-overlay" aria-hidden="true">
            {uploading ? '…' : <Camera size={22} />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="avatar-file-input" onChange={handleAvatar} aria-label="Choose profile picture" />
        <p className="avatar-upload-hint">Tap to upload · Max 2 MB</p>
      </div>

      {/* Form */}
      <form id="spage-account-form" onSubmit={handleSubmit} className="spage-form">
        <div className="spage-field-row">
          <div className="field-block">
            <label htmlFor="sp-first">First name</label>
            <input id="sp-first" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane…" />
          </div>
          <div className="field-block">
            <label htmlFor="sp-last">Last name</label>
            <input id="sp-last" type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith…" />
          </div>
        </div>
        <div className="field-block">
          <label>Email</label>
          <input type="email" value={user?.email ?? ''} disabled className="field-disabled" />
        </div>
      </form>

      <div className="spage-actions">
        <button type="submit" form="spage-account-form" className="btn-primary spage-save-btn" disabled={saving || uploading}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ── Preferences view ──────────────────────────────────────────────────────

function PrefRow({ label, hint, children, inline = false }) {
  return (
    <div className={`settings-pref-row${inline ? ' settings-pref-row--inline' : ''}`}>
      <div className="settings-pref-info">
        <span className="settings-pref-label">{label}</span>
        {hint && <span className="settings-pref-hint">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function PreferencesView() {
  const { prefs, updatePrefs } = useAuth()
  const { themeMode, setThemeMode } = useTheme()
  const { toast } = useToast()

  const save = async (patch) => {
    try { await updatePrefs(patch) }
    catch (err) { toast.error(err.message || 'Failed to save preference') }
  }

  return (
    <div className="spage-body settings-prefs-body">
      <PrefRow label="Theme" hint="Choose light, dark, or follow your system setting.">
        <SegmentedControl
          value={themeMode}
          onChange={setThemeMode}
          options={[
            { value: 'system', label: 'System', icon: <Desktop size={13} weight="bold" /> },
            { value: 'light',  label: 'Light',  icon: <Sun     size={13} weight="bold" /> },
            { value: 'dark',   label: 'Dark',   icon: <Moon    size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>
      <PrefRow label="Default view" hint="The view mode loaded when you open a project.">
        <SegmentedControl
          value={prefs.defaultView}
          onChange={v => save({ defaultView: v })}
          options={[
            { value: 'board',    label: 'Board',    icon: <SquaresFour   size={13} weight="bold" /> },
            { value: 'list',     label: 'List',     icon: <List          size={13} weight="bold" /> },
            { value: 'calendar', label: 'Calendar', icon: <CalendarBlank size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>
      <PrefRow label="Card density" hint="Compact hides descriptions. Expanded shows full content.">
        <SegmentedControl
          value={prefs.cardDensity}
          onChange={v => save({ cardDensity: v })}
          options={[
            { value: 'compact',     label: 'Compact',  icon: <Rows      size={13} weight="bold" /> },
            { value: 'comfortable', label: 'Default',  icon: <Cards     size={13} weight="bold" /> },
            { value: 'expanded',    label: 'Expanded', icon: <ArrowsOut size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>
      <PrefRow label="Date format" hint='Relative: "2d". Absolute: "Jun 7".'>
        <SegmentedControl
          value={prefs.dateFormat}
          onChange={v => save({ dateFormat: v })}
          options={[
            { value: 'relative', label: 'Relative', icon: <Clock       size={13} weight="bold" /> },
            { value: 'absolute', label: 'Absolute', icon: <CalendarDot size={13} weight="bold" /> },
          ]}
        />
      </PrefRow>
      <PrefRow label="Week starts on" hint="Affects Gantt and Calendar views.">
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

// ── Notifications view ────────────────────────────────────────────────────

function NotificationsView() {
  const { prefs, updatePrefs } = useAuth()
  const { toast } = useToast()

  const save = async (patch) => {
    try { await updatePrefs(patch) }
    catch (err) { toast.error(err.message || 'Failed to save preference') }
  }

  return (
    <div className="spage-body settings-prefs-body">
      <PrefRow
        label="Due-time reminders"
        hint="Toast notification when a task with a set time is approaching."
        inline
      >
        <Toggle id="sp-toggle-inapp" checked={prefs.inAppReminders} onChange={v => save({ inAppReminders: v })} />
      </PrefRow>
      <PrefRow
        label="Due-date digest"
        hint="Email the day before tasks in your workspaces are due."
        inline
      >
        <Toggle id="sp-toggle-email" checked={prefs.emailReminders} onChange={v => save({ emailReminders: v })} />
      </PrefRow>
      <p className="settings-prefs-autosave">Changes save automatically.</p>
    </div>
  )
}

// ── Main list view ────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'account',       label: 'Account' },
  { key: 'preferences',   label: 'Preferences' },
  { key: 'notifications', label: 'Notifications' },
]

function MainView({ onSection }) {
  const { profile, user, displayName } = useAuth()
  const initial = displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="spage-body">
      {/* Profile hero */}
      <div className="spage-profile-hero">
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" className="spage-hero-avatar spage-hero-avatar--photo" />
          : <span className="spage-hero-avatar" style={{ background: userColor(user?.id ?? '') }} aria-hidden="true">{initial}</span>
        }
        <div className="spage-hero-info">
          <span className="spage-hero-name">{displayName || 'No name set'}</span>
          <span className="spage-hero-email">{user?.email}</span>
        </div>
      </div>

      {/* Section rows */}
      <div className="spage-section-list">
        {SECTIONS.map(s => (
          <button key={s.key} className="spage-section-row" onClick={() => onSection(s.key)}>
            <span className="spage-section-label">{s.label}</span>
            <CaretRight size={16} weight="bold" className="spage-section-caret" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────

const VIEW_TITLES = {
  main:          'Settings',
  account:       'Account',
  preferences:   'Preferences',
  notifications: 'Notifications',
}

export default function SettingsPage() {
  const [view, setView] = useState('main')
  const navigate = useNavigate()

  const handleBack = () => {
    if (view === 'main') navigate(-1)
    else setView('main')
  }

  return (
    <div className="spage">
      <div className="spage-hdr">
        <button className="spage-back-btn" onClick={handleBack} aria-label="Back">
          <ArrowLeft size={20} weight="bold" aria-hidden="true" />
        </button>
        <h1 className="spage-title">{VIEW_TITLES[view]}</h1>
      </div>

      {view === 'main'          && <MainView          onSection={setView} />}
      {view === 'account'       && <AccountView />}
      {view === 'preferences'   && <PreferencesView />}
      {view === 'notifications' && <NotificationsView />}
    </div>
  )
}
