import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, Check, X } from '@phosphor-icons/react'
import { userColor } from '../../lib/userColor'

function memberInitials(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  const name = full || m.email?.split('@')[0] || '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || 'Unknown'
}

// ── Shared trigger content ────────────────────────────────────────────────────
function TriggerContent({ selected }) {
  return selected ? (
    <>
      <span className="assignee-picker-avatar" style={{ background: userColor(selected.user_id) }} aria-hidden="true">
        {memberInitials(selected)}
      </span>
      <span className="assignee-picker-name">{memberDisplayName(selected)}</span>
    </>
  ) : (
    <span className="assignee-picker-placeholder">Unassigned</span>
  )
}

// ── Mobile bottom sheet ───────────────────────────────────────────────────────
function AssigneeMobileSheet({ members, value, onSelect, onClose }) {
  return createPortal(
    <div
      className="assignee-mob-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Assign to"
    >
      <div className="assignee-mob-sheet" onClick={e => e.stopPropagation()}>
        <div className="assignee-mob-handle" aria-hidden="true" />

        <div className="assignee-mob-hdr">
          <span className="assignee-mob-title">Assign to</span>
          <button
            type="button"
            className="assignee-mob-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="assignee-mob-list" role="listbox" aria-label="Select assignee">
          {/* Unassigned option */}
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`assignee-mob-option${!value ? ' assignee-mob-option--active' : ''}`}
            onClick={() => onSelect('')}
          >
            <span className="assignee-picker-avatar assignee-picker-avatar--empty" aria-hidden="true">–</span>
            <span className="assignee-mob-name">Unassigned</span>
            {!value && <Check size={15} weight="bold" className="assignee-mob-check" aria-hidden="true" />}
          </button>

          {members.map(m => (
            <button
              key={m.user_id}
              type="button"
              role="option"
              aria-selected={value === m.user_id}
              className={`assignee-mob-option${value === m.user_id ? ' assignee-mob-option--active' : ''}`}
              onClick={() => onSelect(m.user_id)}
            >
              <span
                className="assignee-picker-avatar assignee-mob-avatar"
                style={{ background: userColor(m.user_id) }}
                aria-hidden="true"
              >
                {memberInitials(m)}
              </span>
              <span className="assignee-mob-name">{memberDisplayName(m)}</span>
              {value === m.user_id && (
                <Check size={15} weight="bold" className="assignee-mob-check" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AssigneePicker({ members = [], value = '', onChange, canEdit = true }) {
  const [open,     setOpen]     = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768)
  const ref = useRef(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Desktop: close on outside click
  useEffect(() => {
    if (!open || isMobile) return
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open, isMobile])

  const selected = members.find(m => m.user_id === value) ?? null

  const handleSelect = (userId) => {
    onChange(userId)
    setOpen(false)
  }

  // Read-only display
  if (!canEdit) {
    return selected ? (
      <div className="assignee-picker-display">
        <span className="assignee-picker-avatar" style={{ background: userColor(selected.user_id) }} aria-hidden="true">
          {memberInitials(selected)}
        </span>
        <span>{memberDisplayName(selected)}</span>
      </div>
    ) : <span className="task-panel-empty">Unassigned</span>
  }

  // ── Mobile: trigger + portal bottom sheet ──
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          className="assignee-picker-trigger"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={selected ? `Assignee: ${memberDisplayName(selected)}` : 'Assignee: Unassigned'}
        >
          <TriggerContent selected={selected} />
          <CaretDown size={11} weight="bold" className="assignee-picker-caret" aria-hidden="true" />
        </button>

        {open && (
          <AssigneeMobileSheet
            members={members}
            value={value}
            onSelect={handleSelect}
            onClose={() => setOpen(false)}
          />
        )}
      </>
    )
  }

  // ── Desktop: inline dropdown ──
  return (
    <div className="assignee-picker" ref={ref}>
      <button
        type="button"
        className="assignee-picker-trigger"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected ? `Assignee: ${memberDisplayName(selected)}` : 'Assignee: Unassigned'}
      >
        <TriggerContent selected={selected} />
        <CaretDown size={11} weight="bold" className="assignee-picker-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="assignee-picker-dropdown" role="listbox" aria-label="Select assignee">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`assignee-picker-option${!value ? ' assignee-picker-option--active' : ''}`}
            onClick={() => handleSelect('')}
          >
            <span className="assignee-picker-avatar assignee-picker-avatar--empty" aria-hidden="true">–</span>
            <span>Unassigned</span>
            {!value && <Check size={13} weight="bold" className="assignee-picker-check" aria-hidden="true" />}
          </button>
          {members.map(m => (
            <button
              key={m.user_id}
              type="button"
              role="option"
              aria-selected={value === m.user_id}
              className={`assignee-picker-option${value === m.user_id ? ' assignee-picker-option--active' : ''}`}
              onClick={() => handleSelect(m.user_id)}
            >
              <span className="assignee-picker-avatar" style={{ background: userColor(m.user_id) }} aria-hidden="true">
                {memberInitials(m)}
              </span>
              <span>{memberDisplayName(m)}</span>
              {value === m.user_id && <Check size={13} weight="bold" className="assignee-picker-check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
