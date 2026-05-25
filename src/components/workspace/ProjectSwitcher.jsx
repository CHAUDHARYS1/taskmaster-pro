import { useRef, useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

const COLOR_PALETTE = [
  '#2563EB', '#16a34a', '#7c3aed', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#475569',
]

function ColorDot({ color, size = 10 }) {
  return (
    <span
      className="project-color-dot"
      style={{ background: color, width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export default function ProjectSwitcher() {
  const { projects, currentProject, switchProject, createProject, renameProject, removeProject } =
    useProject()
  const { userRole } = useWorkspace()
  const { toast }    = useToast()
  const canEdit      = userRole !== 'viewer'
  const canDelete    = userRole === 'owner'

  const [showNew,      setShowNew]      = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newColor,     setNewColor]     = useState(COLOR_PALETTE[0])
  const [renaming,     setRenaming]     = useState(null) // project id
  const [renameVal,    setRenameVal]    = useState('')
  const [saving,       setSaving]       = useState(false)

  const newInputRef    = useRef(null)
  const renameInputRef = useRef(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      await createProject({ name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor(COLOR_PALETTE[0])
      setShowNew(false)
      toast.success('Project created')
    } catch (err) {
      toast.error(err.message || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const handleRename = async (id) => {
    const val = renameVal.trim()
    if (!val) { setRenaming(null); return }
    try {
      await renameProject(id, val)
    } catch (err) {
      toast.error(err.message || 'Failed to rename project')
    } finally {
      setRenaming(null)
    }
  }

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? All tasks in this project will be permanently deleted.`)) return
    try {
      await removeProject(project.id)
      toast.success(`"${project.name}" deleted`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete project')
    }
  }

  return (
    <div className="project-switcher">
      <div className="project-switcher-hdr">
        <span className="project-switcher-title">Projects</span>
        {canEdit && (
          <button
            className="project-add-btn"
            onClick={() => { setShowNew(s => !s); setTimeout(() => newInputRef.current?.focus(), 50) }}
            aria-label="Add project"
            title="New project"
          >
            +
          </button>
        )}
      </div>

      <ul className="project-list" role="list">
        {projects.map(p => (
          <li key={p.id} className="project-list-item">
            {renaming === p.id ? (
              <form
                className="project-rename-form"
                onSubmit={e => { e.preventDefault(); handleRename(p.id) }}
              >
                <input
                  ref={renameInputRef}
                  className="project-rename-input"
                  value={renameVal}
                  onChange={e => setRenameVal(e.target.value)}
                  onBlur={() => handleRename(p.id)}
                  onKeyDown={e => { if (e.key === 'Escape') setRenaming(null) }}
                  autoFocus
                />
              </form>
            ) : (
              <button
                className={`project-item-btn${currentProject?.id === p.id ? ' project-item-btn--active' : ''}`}
                onClick={() => switchProject(p)}
                onDoubleClick={() => {
                  if (!canEdit) return
                  setRenaming(p.id)
                  setRenameVal(p.name)
                }}
              >
                <ColorDot color={p.color} />
                <span className="project-item-name">{p.name}</span>
                {canDelete && projects.length > 1 && (
                  <span
                    className="project-delete-btn"
                    role="button"
                    tabIndex={0}
                    aria-label={`Delete ${p.name}`}
                    onClick={e => { e.stopPropagation(); handleDelete(p) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleDelete(p) } }}
                  >
                    ×
                  </span>
                )}
              </button>
            )}
          </li>
        ))}
      </ul>

      {showNew && canEdit && (
        <form className="project-new-form" onSubmit={handleCreate}>
          <input
            ref={newInputRef}
            className="project-new-input"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Project name…"
            onKeyDown={e => { if (e.key === 'Escape') setShowNew(false) }}
            autoFocus
          />
          <div className="project-color-row">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                className={`project-color-swatch${newColor === c ? ' project-color-swatch--selected' : ''}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
                aria-label={c}
              />
            ))}
          </div>
          <div className="project-new-actions">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setShowNew(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-sm"
              disabled={!newName.trim() || saving}
            >
              {saving ? '…' : 'Create'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
