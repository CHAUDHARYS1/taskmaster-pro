import { useState } from 'react'
import { X } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function CreateWorkspaceModal({ onClose }) {
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const { createWorkspace }   = useWorkspace()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await createWorkspace(name.trim())
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-hdr">
          <h2 className="modal-ttl">New Workspace</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={14} weight="bold" aria-hidden="true" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field-block">
              <label htmlFor="ws-name">Workspace name</label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Design Team"
                autoFocus
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-ftr">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
