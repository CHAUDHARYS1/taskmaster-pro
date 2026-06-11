import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BellSimple, X, Check, Trash,
  Chat, UserCircle, CheckCircle,
  Warning, Clock, UserPlus, UserMinus, Buildings, ArrowSquareOut, Gear,
} from '@phosphor-icons/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNotifications } from '../../contexts/NotificationContext'

dayjs.extend(relativeTime)

const TYPE_META = {
  task_assigned:     { Icon: UserCircle,     color: 'var(--accent)' },
  task_moved:        { Icon: ArrowSquareOut, color: 'var(--blue,#3b82f6)' },
  task_completed:    { Icon: CheckCircle,    color: 'var(--green,#10b981)' },
  comment_added:     { Icon: Chat,           color: 'var(--purple,#8b5cf6)' },
  mention:           { Icon: Chat,           color: 'var(--accent)' },
  due_soon:          { Icon: Clock,          color: 'var(--amber,#f59e0b)' },
  overdue:           { Icon: Warning,        color: 'var(--red,#ef4444)' },
  member_joined:     { Icon: UserPlus,       color: 'var(--green,#10b981)' },
  member_removed:    { Icon: UserMinus,      color: 'var(--red,#ef4444)' },
  workspace_renamed: { Icon: Buildings,      color: 'var(--ink-3)' },
}

function groupByTime(notifications) {
  const today     = dayjs().startOf('day')
  const yesterday = today.subtract(1, 'day')
  const weekAgo   = today.subtract(7, 'day')
  const groups = [
    { key: 'Today',     items: [] },
    { key: 'Yesterday', items: [] },
    { key: 'This week', items: [] },
    { key: 'Earlier',   items: [] },
  ]
  for (const n of notifications) {
    const d = dayjs(n.created_at)
    if (d.isAfter(today))          groups[0].items.push(n)
    else if (d.isAfter(yesterday)) groups[1].items.push(n)
    else if (d.isAfter(weekAgo))   groups[2].items.push(n)
    else                           groups[3].items.push(n)
  }
  return groups.filter(g => g.items.length > 0)
}

function NotifItem({ notif, onRead, onTaskClick }) {
  const meta = TYPE_META[notif.type] ?? { Icon: Bell, color: 'var(--ink-3)' }
  const { Icon, color } = meta

  const handleClick = () => {
    if (!notif.read) onRead(notif.id)
    if (notif.task_id && onTaskClick) onTaskClick(notif.task_id)
  }

  return (
    <div
      className={`notif-item${notif.read ? '' : ' notif-item--unread'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && handleClick()}
      aria-label={notif.title}
    >
      <span className="notif-item-icon" style={{ color }} aria-hidden="true">
        <Icon size={15} weight="fill" />
      </span>
      <div className="notif-item-content">
        <p className="notif-item-title">{notif.title}</p>
        {notif.body && <p className="notif-item-body">{notif.body}</p>}
        <p className="notif-item-time">{dayjs(notif.created_at).fromNow()}</p>
      </div>
      {!notif.read && (
        <button
          className="notif-item-read-btn"
          onClick={e => { e.stopPropagation(); onRead(notif.id) }}
          aria-label="Mark as read"
          title="Mark as read"
        >
          <Check size={11} weight="bold" />
        </button>
      )}
    </div>
  )
}

const PREF_LABELS = {
  task_assigned:     'Task assigned to me',
  task_moved:        'My task is moved to a new column',
  task_completed:    'My task is marked done',
  comment_added:     'New comment on my task',
  mention:           '@mentions',
  due_soon:          'Due soon (24-hour warning)',
  overdue:           'Overdue tasks',
  member_joined:     'Member joined workspace',
  member_removed:    'Member removed from workspace',
  workspace_renamed: 'Workspace renamed',
}

function PreferencesPanel({ preferences, onSave }) {
  const [local, setLocal] = useState(preferences ?? {})

  useEffect(() => {
    if (preferences) setLocal(preferences)
  }, [preferences])

  const toggle = (key) => {
    const val = !local[key]
    setLocal(prev => ({ ...prev, [key]: val }))
    onSave({ [key]: val })
  }

  return (
    <div className="notif-prefs">
      <p className="notif-prefs-desc">Choose what sends you a notification.</p>
      {Object.entries(PREF_LABELS).map(([key, label]) => (
        <label key={key} className="notif-pref-row">
          <span className="notif-pref-label">{label}</span>
          <button
            role="switch"
            aria-checked={!!local[key]}
            className={`notif-pref-toggle${local[key] ? ' notif-pref-toggle--on' : ''}`}
            onClick={() => toggle(key)}
            aria-label={label}
          >
            <span className="notif-pref-thumb" aria-hidden="true" />
          </button>
        </label>
      ))}
    </div>
  )
}

// ── BellButton — rendered in sidebar header ───────────────────────────────────

export function BellButton() {
  const { unreadCount, togglePanel } = useNotifications()
  return (
    <button
      className="notif-bell-btn"
      data-notif-bell="true"
      onClick={togglePanel}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      title="Notifications"
    >
      {unreadCount > 0
        ? <BellSimple size={17} weight="fill" aria-hidden="true" />
        : <Bell       size={17}               aria-hidden="true" />
      }
      {unreadCount > 0 && (
        <span className="notif-bell-badge" aria-hidden="true">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// ── NotificationPanel — floating popover rendered via portal ──────────────────

export default function NotificationPanel() {
  const {
    notifications, panelOpen, closePanel,
    markRead, markAllRead, clearRead,
    preferences, savePreferences, unreadCount,
  } = useNotifications()
  const navigate = useNavigate()

  const [tab, setTab]   = useState('feed')
  const [pos, setPos]   = useState({ top: 60, left: 240 })
  const panelRef        = useRef(null)

  // Position the popover next to the bell button
  useLayoutEffect(() => {
    if (!panelOpen) return
    const bell = document.querySelector('[data-notif-bell]')
    if (!bell) return
    const rect    = bell.getBoundingClientRect()
    const MARGIN  = 10
    const POP_W   = 344
    const POP_H   = Math.min(520, window.innerHeight - 32)

    let left = rect.right + MARGIN
    let top  = rect.top

    // Flip left if off right edge
    if (left + POP_W > window.innerWidth - 8) left = rect.left - POP_W - MARGIN
    // Clamp vertically
    if (top + POP_H > window.innerHeight - 8) top = window.innerHeight - POP_H - 8
    top = Math.max(8, top)

    setPos({ top, left })
  }, [panelOpen])

  // Close on Escape
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e) => { if (e.key === 'Escape') closePanel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [panelOpen, closePanel])

  // Close on click outside
  useEffect(() => {
    if (!panelOpen) return
    const handler = (e) => {
      if (e.target.closest('[data-notif-bell]')) return
      if (panelRef.current && !panelRef.current.contains(e.target)) closePanel()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [panelOpen, closePanel])

  const handleTaskClick = (taskId) => {
    closePanel()
    sessionStorage.setItem('tm_openTask', taskId)
    navigate('/app')
    document.dispatchEvent(new CustomEvent('tm:openTask', { detail: taskId }))
  }

  if (!panelOpen) return null

  const groups = groupByTime(notifications)

  return createPortal(
    <aside
      ref={panelRef}
      className="notif-popover"
      style={{ top: pos.top, left: pos.left }}
      aria-label="Notifications"
      role="complementary"
    >
      {/* Header */}
      <div className="notif-popover-header">
        <div className="notif-popover-header-top">
          <h2 className="notif-panel-title">Notifications</h2>
          <button className="notif-close-btn" onClick={closePanel} aria-label="Close notifications">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="notif-panel-tabs">
          <button
            className={`notif-tab${tab === 'feed' ? ' notif-tab--active' : ''}`}
            onClick={() => setTab('feed')}
          >
            Feed
            {unreadCount > 0 && <span className="notif-tab-badge">{unreadCount}</span>}
          </button>
          <button
            className={`notif-tab${tab === 'prefs' ? ' notif-tab--active' : ''}`}
            onClick={() => setTab('prefs')}
          >
            <Gear size={13} aria-hidden="true" />
            Preferences
          </button>
        </div>
      </div>

      {/* Feed tab */}
      {tab === 'feed' ? (
        <>
          {notifications.length > 0 && (
            <div className="notif-actions-bar">
              {unreadCount > 0 && (
                <button className="notif-action-btn" onClick={markAllRead}>
                  <Check size={12} weight="bold" aria-hidden="true" />
                  Mark all read
                </button>
              )}
              <button className="notif-action-btn notif-action-btn--danger" onClick={clearRead}>
                <Trash size={12} aria-hidden="true" />
                Clear read
              </button>
            </div>
          )}

          <div className="notif-list">
            {groups.length === 0 ? (
              <div className="notif-empty">
                <Bell size={32} className="notif-empty-icon" aria-hidden="true" />
                <p>You're all caught up!</p>
                <p className="notif-empty-sub">New activity will appear here.</p>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.key} className="notif-group">
                  <p className="notif-group-label">{group.key}</p>
                  {group.items.map(n => (
                    <NotifItem
                      key={n.id}
                      notif={n}
                      onRead={markRead}
                      onTaskClick={n.task_id ? handleTaskClick : undefined}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="notif-list">
          <PreferencesPanel preferences={preferences} onSave={savePreferences} />
        </div>
      )}
    </aside>,
    document.body
  )
}
