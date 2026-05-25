import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

export default function WorkspaceSettingsModal({ onClose }) {
  const { currentWorkspace, autoSave, updateWorkspaceSettings } = useWorkspace()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    setSaving(true)
    try {
      await updateWorkspaceSettings(currentWorkspace.id, { auto_save: !autoSave })
      toast.success(`Auto-save ${!autoSave ? 'enabled' : 'disabled'}`)
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="modal-box ws-settings-modal" role="dialog" aria-modal="true" aria-label="Workspace settings">
        <div className="modal-hdr">
          <h2 className="modal-title">Workspace Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-body">
          <div className="ws-settings-row">
            <div className="ws-settings-info">
              <span className="ws-settings-label">Auto-save task edits</span>
              <span className="ws-settings-desc">
                When off, title and description changes require a manual Save.
              </span>
            </div>
            <button
              className={`toggle-btn${autoSave ? ' toggle-btn--on' : ''}`}
              onClick={handleToggle}
              disabled={saving}
              aria-pressed={autoSave}
              aria-label="Toggle auto-save"
            />
          </div>
        </div>
      </div>
    </>
  )
}
