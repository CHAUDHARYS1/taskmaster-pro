import { useEffect, useMemo, useState } from 'react'
import { X, PencilSimple, Check } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProject } from '../../contexts/ProjectContext'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { DEFAULT_COLUMNS } from '../board/Board'
import { ALL_COLUMN_IDS } from '../../contexts/WorkspaceContext'

const COLUMN_PRESET_COLORS = [
  '#6366f1', '#2563EB', '#0ea5e9', '#0f766e',
  '#22c55e', '#d97706', '#ef4444', '#ec4899',
  '#7c3aed', '#555555',
]

const WORDS = [
  'avalanche','biscuit','chimney','driftwood','eclipse','falcon',
  'glacier','harbor','ignite','jungle','keystone','lantern',
  'marble','nautical','obsidian','phantom','quicksand','ridgeline',
  'solstice','tundra','umbra','vortex','whisper','zenith',
]
function randomWord() { return WORDS[Math.floor(Math.random() * WORDS.length)] }

const ROLE_LABELS = { owner: 'Owner', member: 'Member', viewer: 'Viewer' }

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}
function memberInitial(m) {
  if (m.first_name) return m.first_name[0].toUpperCase()
  return (m.email ?? '?')[0].toUpperCase()
}

export default function WorkspaceSettingsModal({ onClose, canEdit }) {
  const { currentWorkspace, autoSave, userRole, columnLabels, workspaceColumns, updateWorkspaceSettings, updateColumnLabels, renameWorkspace, deleteWorkspace } = useWorkspace()
  const { user }     = useAuth()
  const { projects, currentProject, removeProject, renameProject } = useProject()
  const { members, inviteMember, removeMember } = useMembers(currentWorkspace?.id)
  const { toast }    = useToast()

  const isOwner    = userRole === 'owner'
  const isPersonal = currentWorkspace?.id === user?.id

  const [tab, setTab]       = useState('general')
  const [saving, setSaving] = useState(false)

  const [draftName,   setDraftName]   = useState(currentWorkspace?.name ?? '')
  const [nameSaving,  setNameSaving]  = useState(false)
  const nameChanged = draftName.trim() !== '' && draftName.trim() !== currentWorkspace?.name

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('member')
  const [inviting,    setInviting]    = useState(false)
  const [inviteLink,  setInviteLink]  = useState('')
  const [inviteError, setInviteError] = useState('')

  const confirmWord = useMemo(() => randomWord(), [])
  const [typed,    setTyped]    = useState('')
  const [deleting, setDeleting] = useState(false)

  const [colSaving, setColSaving] = useState(false)

  // Unified column manager — one source of truth for names + visibility + custom columns
  const [draftColumns, setDraftColumns] = useState(() => workspaceColumns.map(c => ({ ...c })))
  const [newColLabel, setNewColLabel]   = useState('')
  const [colManagerSaving, setColManagerSaving] = useState(false)

  // Reset draft whenever the saved workspace columns change (e.g. after a successful save)
  useEffect(() => {
    setDraftColumns(workspaceColumns.map(c => ({ ...c })))
  }, [currentWorkspace?.id, currentWorkspace?.column_labels])

  const columnsChanged = (() => {
    if (draftColumns.length !== workspaceColumns.length) return true
    return draftColumns.some((c, i) =>
      c.id !== workspaceColumns[i]?.id ||
      c.label !== workspaceColumns[i]?.label ||
      c.color !== workspaceColumns[i]?.color
    )
  })()

  const handleAddColumn = () => {
    const trimmed = newColLabel.trim()
    if (!trimmed) return
    const id = `col_${Date.now()}`
    const color = COLUMN_PRESET_COLORS[draftColumns.length % COLUMN_PRESET_COLORS.length]
    setDraftColumns(prev => [...prev, { id, label: trimmed, color }])
    setNewColLabel('')
  }

  const handleRemoveColumn = (id) => {
    if (draftColumns.length <= 1) { toast.error('At least one column must remain'); return }
    setDraftColumns(prev => prev.filter(c => c.id !== id))
  }

  const handleRenameColumn = (id, label) => {
    setDraftColumns(prev => prev.map(c => c.id === id ? { ...c, label } : c))
  }

  const handleSetColumnColor = (id, color) => {
    setDraftColumns(prev => prev.map(c => c.id === id ? { ...c, color } : c))
  }

  const handleSaveColumns = async () => {
    if (draftColumns.some(c => !c.label.trim())) { toast.error('All columns need a name'); return }

    const newIds = draftColumns.map(c => c.id)

    // Build new column_labels: preserve metadata keys, write labels + colors + order
    const existing = currentWorkspace?.column_labels ?? {}
    const metadata = Object.fromEntries(Object.entries(existing).filter(([k]) => k.startsWith('_')))
    const labels   = Object.fromEntries(draftColumns.map(c => [c.id, c.label.trim()]))
    const colors   = Object.fromEntries(draftColumns.map(c => [c.id, c.color]))
    const toSave   = { ...metadata, ...labels, _columns: newIds, _column_colors: colors }

    setColManagerSaving(true)
    try {
      await updateColumnLabels(currentWorkspace.id, toSave)
      toast.success('Columns saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save columns')
    } finally {
      setColManagerSaving(false)
    }
  }

  const handleRenameWorkspace = async (e) => {
    e.preventDefault()
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === currentWorkspace?.name) return
    setNameSaving(true)
    try {
      await renameWorkspace(currentWorkspace.id, trimmed)
      toast.success('Workspace renamed')
    } catch (err) {
      toast.error(err.message || 'Failed to rename workspace')
    } finally {
      setNameSaving(false)
    }
  }

  const handleToggleAutoSave = async () => {
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

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    try {
      const invite = await inviteMember({ email: inviteEmail, role: inviteRole, workspaceName: currentWorkspace?.name })
      setInviteLink(`${window.location.origin}/invite/${invite.token}`)
      toast.success(`Invite sent to ${inviteEmail}`)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (m) => {
    if (!window.confirm(`Remove ${memberDisplayName(m)} from this workspace?`)) return
    try {
      await removeMember(m.user_id)
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  const handleDeleteWorkspace = async () => {
    if (typed !== confirmWord || deleting) return
    setDeleting(true)
    try {
      await deleteWorkspace(currentWorkspace.id)
      toast.success(`"${currentWorkspace.name}" deleted`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace')
      setDeleting(false)
    }
  }

  const handleDeleteProject = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? All tasks in this project will be permanently deleted.`)) return
    try {
      await removeProject(p.id)
      toast.success(`"${p.name}" deleted`)
    } catch (err) {
      toast.error(err.message || 'Failed to delete project')
    }
  }

  const handleToggleColumn = async (colId) => {
    if (!currentProject) return
    const wsIds = workspaceColumns.map(c => c.id)
    const enabled = currentProject.enabled_columns ?? wsIds
    // Maintain workspace column order when deriving next state
    const next = wsIds.filter(id => id === colId ? !enabled.includes(id) : enabled.includes(id))
    if (next.length === 0) { toast.error('At least one column must be enabled'); return }
    setColSaving(true)
    try {
      await renameProject(currentProject.id, currentProject.name, { enabled_columns: next })
    } catch (err) {
      toast.error(err.message || 'Failed to update columns')
    } finally {
      setColSaving(false)
    }
  }

  const [renamingProject, setRenamingProject] = useState(null) // { id, name }

  const handleStartRenameProject = (p) => setRenamingProject({ id: p.id, name: p.name })

  const handleConfirmRenameProject = async () => {
    if (!renamingProject) return
    const trimmed = renamingProject.name.trim()
    if (!trimmed) { setRenamingProject(null); return }
    try {
      await renameProject(renamingProject.id, trimmed)
      toast.success('Project renamed')
    } catch (err) {
      toast.error(err.message || 'Failed to rename project')
    } finally {
      setRenamingProject(null)
    }
  }

  const TABS = [
    { id: 'general',  label: 'General' },
    { id: 'members',  label: 'Members' },
    { id: 'projects', label: 'Projects' },
    ...(isOwner ? [{ id: 'danger', label: 'Danger' }] : []),
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet ws-settings-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace settings"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Workspace Settings</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>

        <div className="ws-settings-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`ws-settings-tab${tab === t.id ? ' ws-settings-tab--active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body ws-settings-body">

          {/* General */}
          {tab === 'general' && (
            <div className="ws-settings-section">

              <form className="ws-rename-form" onSubmit={handleRenameWorkspace}>
                <label className="ws-settings-label" htmlFor="ws-name-input">
                  Workspace name
                </label>
                <p className="ws-settings-desc">
                  This name appears in the sidebar and across the app.
                </p>
                <div className="ws-rename-row">
                  <input
                    id="ws-name-input"
                    type="text"
                    className="ws-rename-input"
                    value={draftName}
                    onChange={e => setDraftName(e.target.value)}
                    placeholder="Workspace name…"
                    maxLength={60}
                    disabled={!isOwner || nameSaving}
                    aria-label="Workspace name"
                  />
                  {isOwner && (
                    <button
                      type="submit"
                      className="btn-primary btn-sm"
                      disabled={!nameChanged || nameSaving}
                    >
                      {nameSaving ? 'Saving…' : 'Rename'}
                    </button>
                  )}
                </div>
              </form>

              <div className="ws-settings-divider" />

              <div className="ws-settings-row">
                <div className="ws-settings-info">
                  <span className="ws-settings-label">Auto-save task edits</span>
                  <span className="ws-settings-desc">
                    When off, title and description changes require a manual Save.
                  </span>
                </div>
                <button
                  className={`toggle-btn${autoSave ? ' toggle-btn--on' : ''}`}
                  onClick={handleToggleAutoSave}
                  disabled={saving || !isOwner}
                  aria-pressed={autoSave}
                  aria-label="Toggle auto-save"
                />
              </div>

              <div className="ws-settings-col-section">
                <p className="ws-settings-label" style={{ marginTop: 'var(--space-5)' }}>Board columns</p>
                <p className="ws-settings-desc">Add, rename, or remove columns. Changes apply workspace-wide.</p>
                <div className="ws-col-rename-list">
                  {draftColumns.map((col, i) => (
                    <div key={col.id} className="ws-col-manager-item">
                      <div className="ws-col-rename-row">
                        <span className="ws-col-rename-index">{i + 1}</span>
                        <input
                          type="text"
                          className="ws-col-rename-input"
                          value={col.label}
                          onChange={e => handleRenameColumn(col.id, e.target.value)}
                          placeholder="Column name"
                          maxLength={30}
                          disabled={!isOwner || colManagerSaving}
                          aria-label={`Column ${i + 1} name`}
                        />
                        {isOwner && (
                          <button
                            className="ws-col-remove-btn"
                            onClick={() => handleRemoveColumn(col.id)}
                            disabled={draftColumns.length <= 1 || colManagerSaving}
                            aria-label={`Remove column ${col.label}`}
                            title="Remove column"
                          >
                            <X size={14} weight="bold" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                      {isOwner && (
                        <div className="ws-col-color-row">
                          {COLUMN_PRESET_COLORS.map(preset => (
                            <button
                              key={preset}
                              type="button"
                              className={`col-color-swatch${col.color === preset ? ' col-color-swatch--active' : ''}`}
                              style={{ background: preset }}
                              onClick={() => handleSetColumnColor(col.id, preset)}
                              aria-label={`Set color ${preset}`}
                              aria-pressed={col.color === preset}
                              disabled={colManagerSaving}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {isOwner && (
                  <div className="ws-col-add-row">
                    <input
                      type="text"
                      className="ws-col-rename-input"
                      value={newColLabel}
                      onChange={e => setNewColLabel(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddColumn() } }}
                      placeholder="New column name…"
                      maxLength={30}
                      disabled={colManagerSaving}
                      aria-label="New column name"
                    />
                    <button
                      className="btn-ghost btn-sm"
                      onClick={handleAddColumn}
                      disabled={!newColLabel.trim() || colManagerSaving}
                    >
                      + Add
                    </button>
                  </div>
                )}

                {isOwner && (
                  <button
                    className="btn-primary btn-sm"
                    style={{ marginTop: 'var(--space-3)', alignSelf: 'flex-start' }}
                    disabled={!columnsChanged || colManagerSaving}
                    onClick={handleSaveColumns}
                  >
                    {colManagerSaving ? 'Saving…' : 'Save columns'}
                  </button>
                )}
              </div>

              {currentProject && (
                <div className="ws-settings-col-section">
                  <p className="ws-settings-label" style={{ marginTop: 'var(--space-5)' }}>
                    Columns — <em>{currentProject.name}</em>
                  </p>
                  <p className="ws-settings-desc">Override which workspace columns this project shows.</p>
                  <div className="ws-settings-col-list">
                    {workspaceColumns.map(col => {
                      const enabled = currentProject.enabled_columns ?? workspaceColumns.map(c => c.id)
                      const isOn = enabled.includes(col.id)
                      return (
                        <label key={col.id} className="ws-settings-col-row">
                          <input
                            type="checkbox"
                            checked={isOn}
                            disabled={colSaving || !isOwner}
                            onChange={() => handleToggleColumn(col.id)}
                          />
                          <span>{col.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Members */}
          {tab === 'members' && (
            <div className="ws-settings-section">
              <ul className="ws-members-list">
                {members.map(m => (
                  <li key={m.user_id} className="ws-member-row">
                    <span className="ws-member-avatar">{memberInitial(m)}</span>
                    <div className="ws-member-info">
                      <span className="ws-member-name">
                        {memberDisplayName(m)}
                        {m.user_id === user?.id && <span className="ws-member-you"> (you)</span>}
                      </span>
                      <span className="ws-member-role">{ROLE_LABELS[m.role]}</span>
                    </div>
                    {isOwner && m.user_id !== user?.id && (
                      <button
                        className="ws-member-remove"
                        onClick={() => handleRemoveMember(m)}
                        aria-label={`Remove ${memberDisplayName(m)}`}
                      >
                        <X size={16} weight="bold" aria-hidden="true" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {canEdit && (
                <div className="ws-invite-section">
                  <p className="ws-settings-label" style={{ marginTop: 'var(--space-5)' }}>Invite member</p>
                  {!inviteLink ? (
                    <form onSubmit={handleInvite} className="ws-invite-form">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="teammate@example.com"
                        required
                        spellCheck={false}
                        className="ws-invite-input"
                      />
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value)}
                        className="field-select ws-invite-role"
                      >
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {inviteError && <p className="form-error">{inviteError}</p>}
                      <button type="submit" className="btn-primary btn-sm" disabled={inviting || !inviteEmail}>
                        {inviting ? 'Sending…' : 'Send invite'}
                      </button>
                    </form>
                  ) : (
                    <div className="ws-invite-success">
                      <p className="invite-success">Invite sent to {inviteEmail}!</p>
                      <p className="invite-hint">Share this backup link — expires in 7 days.</p>
                      <div className="invite-link-row">
                        <input type="text" value={inviteLink} readOnly className="invite-link-input" />
                        <button className="btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                          Copy
                        </button>
                      </div>
                      <button className="btn-ghost btn-sm" onClick={() => { setInviteLink(''); setInviteEmail('') }}>
                        Invite another
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Projects */}
          {tab === 'projects' && (
            <div className="ws-settings-section">
              <p className="ws-settings-label">Manage projects</p>
              <ul className="ws-project-list">
                {projects.map(p => {
                  const isRenaming = renamingProject?.id === p.id
                  return (
                    <li key={p.id} className="ws-project-row">
                      <span className="ws-project-dot" style={{ background: p.color }} />
                      {isRenaming ? (
                        <input
                          className="ws-project-rename-input"
                          value={renamingProject.name}
                          onChange={e => setRenamingProject(prev => ({ ...prev, name: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleConfirmRenameProject()
                            if (e.key === 'Escape') setRenamingProject(null)
                          }}
                          onBlur={handleConfirmRenameProject}
                          autoFocus
                          maxLength={60}
                          aria-label="Project name"
                        />
                      ) : (
                        <span className="ws-project-name">{p.name}</span>
                      )}
                      <div className="ws-project-actions">
                        {isOwner && !isRenaming && (
                          <button
                            className="ws-project-icon-btn"
                            onClick={() => handleStartRenameProject(p)}
                            aria-label={`Rename ${p.name}`}
                            title="Rename"
                          >
                            <PencilSimple size={14} weight="bold" aria-hidden="true" />
                          </button>
                        )}
                        {isRenaming && (
                          <button
                            className="ws-project-icon-btn ws-project-icon-btn--confirm"
                            onClick={handleConfirmRenameProject}
                            aria-label="Confirm rename"
                          >
                            <Check size={14} weight="bold" aria-hidden="true" />
                          </button>
                        )}
                        {isOwner && projects.length > 1 && !isRenaming && (
                          <button
                            className="ws-project-delete"
                            onClick={() => handleDeleteProject(p)}
                            aria-label={`Delete ${p.name}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Danger */}
          {tab === 'danger' && isOwner && (
            <div className="ws-settings-section">
              {isPersonal ? (
                <p className="delete-ws-warning">Your personal workspace cannot be deleted.</p>
              ) : (
                <>
                  <p className="delete-ws-warning">
                    Permanently deletes <strong>{currentWorkspace?.name}</strong> and all its tasks,
                    labels, and members. <strong>This cannot be undone.</strong>
                  </p>
                  <p className="ws-settings-desc">To confirm, type the word below:</p>
                  <div className="delete-ws-confirm-word">{confirmWord}</div>
                  <input
                    type="text"
                    className="delete-ws-input"
                    value={typed}
                    onChange={e => setTyped(e.target.value)}
                    placeholder={`Type "${confirmWord}" to confirm`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    className="btn-danger"
                    disabled={typed !== confirmWord || deleting}
                    onClick={handleDeleteWorkspace}
                    style={{ marginTop: 'var(--space-3)' }}
                  >
                    {deleting ? 'Deleting…' : 'Delete workspace'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
