import { useEffect, useRef, useState } from 'react'
import { CaretDown, Check } from '@phosphor-icons/react'
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

export default function AssigneePicker({ members = [], value = '', onChange, canEdit = true }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const selected = members.find(m => m.user_id === value) ?? null

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
        {selected ? (
          <>
            <span className="assignee-picker-avatar" style={{ background: userColor(selected.user_id) }} aria-hidden="true">
              {memberInitials(selected)}
            </span>
            <span className="assignee-picker-name">{memberDisplayName(selected)}</span>
          </>
        ) : (
          <span className="assignee-picker-placeholder">Unassigned</span>
        )}
        <CaretDown size={11} weight="bold" className="assignee-picker-caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="assignee-picker-dropdown" role="listbox" aria-label="Select assignee">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            className={`assignee-picker-option${!value ? ' assignee-picker-option--active' : ''}`}
            onClick={() => { onChange(''); setOpen(false) }}
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
              onClick={() => { onChange(m.user_id); setOpen(false) }}
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
