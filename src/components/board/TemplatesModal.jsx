import { useState } from 'react'
import { X, BookmarkSimple, Trash, Lightning } from '@phosphor-icons/react'
import { useTemplates } from '../../hooks/useTemplates'
import { useToast } from '../../contexts/ToastContext'

export default function TemplatesModal({
  workspaceId,
  projectId,
  projectTasks = [],
  isOwner = false,
  onClose,
}) {
  const { templates, loading, saveTemplate, applyTemplate, deleteTemplate } = useTemplates(workspaceId)
  const { showToast } = useToast()

  const [saveName, setSaveName]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [applying, setApplying]     = useState(null)
  const [deleting, setDeleting]     = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const handleSave = async () => {
    if (!saveName.trim() || !projectTasks.length) return
    setSaving(true)
    try {
      await saveTemplate(saveName.trim(), projectTasks)
      setSaveName('')
      showToast('Template saved', 'success')
    } catch (err) {
      showToast(err.message ?? 'Failed to save template', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async (templateId) => {
    if (!projectId) return
    setApplying(templateId)
    try {
      const count = await applyTemplate(templateId, projectId)
      showToast(`${count} task${count !== 1 ? 's' : ''} added to project`, 'success')
      onClose()
    } catch (err) {
      showToast(err.message ?? 'Failed to apply template', 'error')
    } finally {
      setApplying(null)
    }
  }

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteTemplate(id)
      setConfirmDelete(null)
      showToast('Template deleted', 'success')
    } catch (err) {
      showToast(err.message ?? 'Failed to delete template', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="templates-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Board templates"
      >
        {/* Header */}
        <div className="modal-hdr">
          <div className="templates-modal__title-row">
            <BookmarkSimple size={18} weight="bold" aria-hidden="true" />
            <h2 className="modal-ttl">Board Templates</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Save section — owner only, current project must have tasks */}
        {isOwner && projectTasks.length > 0 && (
          <div className="templates-modal__save-section">
            <p className="templates-modal__section-label">Save current board</p>
            <div className="templates-modal__save-row">
              <input
                className="templates-modal__name-input"
                type="text"
                placeholder="Template name"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                maxLength={80}
                aria-label="Template name"
              />
              <button
                className="btn-primary templates-modal__save-btn"
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
              >
                {saving ? 'Saving…' : `Save (${projectTasks.length} task${projectTasks.length !== 1 ? 's' : ''})`}
              </button>
            </div>
          </div>
        )}

        {/* Templates list */}
        <div className="templates-modal__list-section">
          <p className="templates-modal__section-label">Saved templates</p>

          {loading ? (
            <p className="templates-modal__empty">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="templates-modal__empty">
              No templates yet.{isOwner && projectTasks.length > 0 ? ' Save the current board above to create one.' : ''}
            </p>
          ) : (
            <ul className="templates-modal__list">
              {templates.map(tmpl => {
                const count = tmpl.board_template_tasks?.length ?? 0
                return (
                  <li key={tmpl.id} className="templates-modal__item">
                    <div className="templates-modal__item-info">
                      <span className="templates-modal__item-name">{tmpl.name}</span>
                      <span className="templates-modal__item-count">{count} task{count !== 1 ? 's' : ''}</span>
                    </div>

                    <div className="templates-modal__item-actions">
                      {projectId && (
                        <button
                          className="templates-modal__apply-btn"
                          onClick={() => handleApply(tmpl.id)}
                          disabled={applying === tmpl.id}
                          aria-label={`Apply template ${tmpl.name}`}
                          title={`Add ${count} task${count !== 1 ? 's' : ''} to current project`}
                        >
                          <Lightning size={14} weight="bold" aria-hidden="true" />
                          {applying === tmpl.id ? 'Applying…' : 'Apply'}
                        </button>
                      )}

                      {(isOwner || true) && (
                        confirmDelete === tmpl.id ? (
                          <span className="templates-modal__confirm-delete">
                            <span className="templates-modal__confirm-label">Delete?</span>
                            <button
                              className="templates-modal__confirm-yes"
                              onClick={() => handleDelete(tmpl.id)}
                              disabled={deleting === tmpl.id}
                            >
                              {deleting === tmpl.id ? '…' : 'Yes'}
                            </button>
                            <button
                              className="templates-modal__confirm-no"
                              onClick={() => setConfirmDelete(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className="templates-modal__delete-btn"
                            onClick={() => setConfirmDelete(tmpl.id)}
                            aria-label={`Delete template ${tmpl.name}`}
                          >
                            <Trash size={14} weight="bold" aria-hidden="true" />
                          </button>
                        )
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
