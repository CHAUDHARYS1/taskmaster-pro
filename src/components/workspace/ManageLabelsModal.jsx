import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { useToast } from '../../contexts/ToastContext'

const PALETTE = [
  '#b91c1c', '#c2410c', '#b45309', '#15803d',
  '#0f766e', '#0369a1', '#2563EB', '#4f46e5',
  '#7c3aed', '#be185d', '#555555', '#1e293b',
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export default function ManageLabelsModal({ onClose }) {
  const { labels, addLabel, deleteLabel } = useLabelsCtx()
  const { toast } = useToast()

  const [name, setName]       = useState('')
  const [color, setColor]     = useState(PALETTE[0])
  const [saving, setSaving]   = useState(false)

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await addLabel({ name, color })
      setName('')
    } catch (err) {
      toast.error(err.message || 'Failed to create label')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, labelName) => {
    try {
      await deleteLabel(id)
      toast.success(`Label "${labelName}" removed`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete label')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Manage labels"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Manage Labels</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={14} weight="bold" aria-hidden="true" /></button>
        </div>

        <div className="modal-body">
          {/* Existing labels */}
          {labels.length === 0 ? (
            <p className="labels-empty">No labels yet. Create one below.</p>
          ) : (
            <ul className="label-list">
              {labels.map(l => (
                <li key={l.id} className="label-list-item">
                  <span
                    className="label-chip"
                    style={{
                      '--label-color': l.color,
                      '--label-bg': `rgba(${hexToRgb(l.color)},0.12)`,
                    }}
                  >
                    {l.name}
                  </span>
                  <button
                    className="label-delete-btn"
                    onClick={() => handleDelete(l.id, l.name)}
                    aria-label={`Delete label ${l.name}`}
                  >
                    <X size={12} weight="bold" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Create new label */}
          <form className="label-create-form" onSubmit={handleAdd}>
            <p className="label-create-heading">New label</p>

            <div className="label-create-row">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Label name"
                maxLength={32}
                autoFocus
                className="label-name-input"
              />

              {/* Preview chip */}
              <span
                className="label-chip label-preview"
                style={{
                  '--label-color': color,
                  '--label-bg': `rgba(${hexToRgb(color)},0.12)`,
                }}
              >
                {name || 'Preview'}
              </span>
            </div>

            {/* Color palette */}
            <div className="label-palette" role="group" aria-label="Pick a colour">
              {PALETTE.map(hex => (
                <button
                  key={hex}
                  type="button"
                  className={`palette-swatch${color === hex ? ' palette-swatch--selected' : ''}`}
                  style={{ background: hex }}
                  onClick={() => setColor(hex)}
                  aria-label={hex}
                  aria-pressed={color === hex}
                />
              ))}
            </div>

            <div className="label-create-actions">
              <button type="button" className="btn-ghost" onClick={onClose}>Done</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={!name.trim() || saving}
              >
                {saving ? 'Adding…' : 'Add label'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
