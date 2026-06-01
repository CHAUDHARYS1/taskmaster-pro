import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Archive, Link, SquaresFour, Rows } from '@phosphor-icons/react'
import { isDesktop } from '../../utils/device'

const COLOR_NAMES = {
  '#2563EB': 'Blue', '#16a34a': 'Green', '#7c3aed': 'Purple', '#dc2626': 'Red',
  '#d97706': 'Amber', '#0891b2': 'Cyan', '#be185d': 'Pink', '#475569': 'Slate',
}
import { useProject } from '../../contexts/ProjectContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

const COLOR_PALETTE = [
  '#2563EB', '#16a34a', '#7c3aed', '#dc2626',
  '#d97706', '#0891b2', '#be185d', '#475569',
]

const VIEW_ICONS = {
  board:   <SquaresFour size={15} aria-hidden="true" />,
  list:    <Rows        size={15} aria-hidden="true" />,
  archive: <Archive     size={15} aria-hidden="true" />,
}

function ColorDot({ color, size = 10 }) {
  return (
    <span
      className="project-color-dot"
      style={{ background: color, width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export default function ProjectSwitcher({ viewMode, onViewChange }) {
  const { projects, currentProject, switchProject, createProject, renameProject } = useProject()
  const { userRole, currentWorkspace } = useWorkspace()
  const { toast }    = useToast()
  const navigate     = useNavigate()
  const location     = useLocation()
  const canEdit      = userRole !== 'viewer'

  const [showNew,   setShowNew]   = useState(false)
  const [newName,   setNewName]   = useState('')
  const [newColor,  setNewColor]  = useState(COLOR_PALETTE[0])
  const [renaming,  setRenaming]  = useState(null)
  const [renameVal, setRenameVal] = useState('')
  const [saving,    setSaving]    = useState(false)

  const newInputRef = useRef(null)

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
        <li className="project-list-item" style={{ '--i': 0 }}>
          <div className="project-item-row">
            <button
              className={`project-item-btn${!currentProject ? ' project-item-btn--active' : ''}`}
              onClick={() => {
                switchProject(null)
                if (location.pathname === '/dashboard') navigate('/')
              }}
            >
              <SquaresFour size={15} className="project-all-icon" aria-hidden="true" />
              <span className="project-item-name">All Projects</span>
            </button>
          </div>
        </li>
        {projects.map((p, idx) => {
          const isActive = currentProject?.id === p.id
          return (
            <li key={p.id} className="project-list-item" style={{ '--i': idx + 1 }}>
              {renaming === p.id ? (
                <form
                  className="project-rename-form"
                  onSubmit={e => { e.preventDefault(); handleRename(p.id) }}
                >
                  <input
                    className="project-rename-input"
                    value={renameVal}
                    onChange={e => setRenameVal(e.target.value)}
                    onBlur={() => handleRename(p.id)}
                    onKeyDown={e => { if (e.key === 'Escape') setRenaming(null) }}
                    autoFocus={isDesktop()}
                  />
                </form>
              ) : (
                <div className="project-item-row">
                  <button
                    className={`project-item-btn${isActive ? ' project-item-btn--active' : ''}`}
                    onClick={() => {
                      switchProject(p)
                      if (location.pathname === '/dashboard') navigate('/')
                    }}
                    onDoubleClick={() => {
                      if (!canEdit) return
                      setRenaming(p.id)
                      setRenameVal(p.name)
                    }}
                  >
                    <ColorDot color={p.color} />
                    <span className="project-item-name">{p.name}</span>
                    {isActive && viewMode && (
                      <span className="project-view-icon" aria-label={`${viewMode} view`}>
                        {VIEW_ICONS[viewMode]}
                      </span>
                    )}
                  </button>
                  <button
                    className="project-link-btn"
                    onClick={() => {
                      const url = `${window.location.origin}/workspace/${currentWorkspace.id}/project/${p.id}`
                      navigator.clipboard.writeText(url)
                      toast.success('Link copied')
                    }}
                    title="Copy project link"
                    aria-label="Copy project link"
                  >
                    <Link size={16} aria-hidden="true" />
                  </button>
                </div>
              )}
            </li>
          )
        })}
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
            autoFocus={isDesktop()}
          />
          <div className="project-color-row">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                type="button"
                className={`project-color-swatch${newColor === c ? ' project-color-swatch--selected' : ''}`}
                style={{ background: c }}
                onClick={() => setNewColor(c)}
                aria-label={COLOR_NAMES[c] ?? c}
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
