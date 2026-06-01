import { useState } from 'react'
import { X, Check } from '@phosphor-icons/react'
import { isDesktop } from '../../utils/device'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { WORKSPACE_TEMPLATES } from '../../lib/workspaceTemplates'

export default function CreateWorkspaceModal({ onClose }) {
  const [name, setName]                   = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(WORKSPACE_TEMPLATES[0])
  const { createWorkspace }               = useWorkspace()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await createWorkspace(name.trim(), selectedTemplate)
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
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field-block">
              <label>Choose a template</label>
              <div className="template-picker">
                {WORKSPACE_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    className={`template-card${selectedTemplate.id === t.id ? ' template-card--active' : ''}`}
                    onClick={() => setSelectedTemplate(t)}
                    aria-pressed={selectedTemplate.id === t.id}
                  >
                    <div className="template-card-header">
                      <span className="template-card-name">{t.name}</span>
                      {selectedTemplate.id === t.id && (
                        <Check size={14} weight="bold" className="template-card-check" aria-hidden="true" />
                      )}
                    </div>
                    <p className="template-card-desc">{t.description}</p>
                    {t.columnLabels && (
                      <div className="template-card-columns">
                        {Object.values(t.columnLabels).map(label => (
                          <span key={label} className="template-column-pill">{label}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-block">
              <label htmlFor="ws-name">Workspace name</label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={selectedTemplate.id === 'job-tracker' ? 'e.g. My Job Search 2025' : 'e.g. Design Team'}
                autoFocus={isDesktop()}
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
