import { useEffect, useMemo, useState } from 'react'
import { X, PencilSimple, Check, Sliders, Users, FolderSimple, WarningCircle, Palette } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProject } from '../../contexts/ProjectContext'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { DEFAULT_COLUMNS } from '../../lib/columns'
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

export default function WorkspaceSettingsPanel({ onClose, canEdit }) {
  const { currentWorkspace, autoSave, autoArchiveDays, userRole, columnLabels, workspaceColumns, updateWorkspaceSettings, updateColumnLabels, renameWorkspace, deleteWorkspace } = useWorkspace()
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

  const [draftEmoji,    setDraftEmoji]    = useState(currentWorkspace?.emoji ?? '')
  const [emojiSaving,   setEmojiSaving]   = useState(false)
  const [colorSaving,   setColorSaving]   = useState(false)

  const handleSaveEmoji = async () => {
    const val = draftEmoji.trim()
    if (val === (currentWorkspace?.emoji ?? '')) return
    setEmojiSaving(true)
    try {
      await updateWorkspaceSettings(currentWorkspace.id, { emoji: val || null })
      toast.success(val ? 'Emoji updated' : 'Emoji removed')
    } catch (err) {
      toast.error(err.message || 'Failed to update emoji')
    } finally {
      setEmojiSaving(false)
    }
  }

  const handleSetColor = async (color) => {
    if (color === currentWorkspace?.color) return
    setColorSaving(true)
    try {
      await updateWorkspaceSettings(currentWorkspace.id, { color })
    } catch (err) {
      toast.error(err.message || 'Failed to update color')
    } finally {
      setColorSaving(false)
    }
  }

  const [archiveSaving, setArchiveSaving] = useState(false)
  const handleSetAutoArchive = async (value) => {
    setArchiveSaving(true)
    try {
      await updateWorkspaceSettings(currentWorkspace.id, {
        auto_archive_after_days: value === '' ? null : Number(value),
      })
      toast.success(value === '' ? 'Auto-archive disabled' : `Auto-archive set to ${value} days`)
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally {
      setArchiveSaving(false)
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

  const [renamingProject,  setRenamingProject]  = useState(null) // { id, name }
  const [coloringProject, setColoringProject] = useState(null) // project id

  const handleStartRenameProject = (p) => setRenamingProject({ id: p.id, name: p.name })

  const handleSetProjectColor = async (p, color) => {
    setColoringProject(null)
    try {
      await renameProject(p.id, p.name, { color })
    } catch (err) {
      toast.error(err.message || 'Failed to update color')
    }
  }

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
    { id: 'general',  label: 'General',  Icon: Sliders },
    { id: 'members',  label: 'Members',  Icon: Users },
    { id: 'projects', label: 'Projects', Icon: FolderSimple },
    ...(isOwner ? [{ id: 'danger', label: 'Danger', Icon: WarningCircle }] : []),
  ]

  return (
    <>
      <div className="ws-panel-overlay" onClick={onClose} aria-hidden="true" />
      <aside className="ws-panel" role="dialog" aria-modal="true" aria-label="Workspace settings">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="ws-panel-hdr">
          <div className="ws-panel-hdr-identity">
            <div className="ws-avatar ws-avatar--sm" style={{ background: currentWorkspace?.color ?? 'var(--accent)' }}>
              {currentWorkspace?.emoji || currentWorkspace?.name?.[0] || '?'}
            </div>
            <span className="ws-panel-ws-name">{currentWorkspace?.name ?? 'Settings'}</span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* ── Body: nav rail + scrollable content ────────────── */}
        <div className="ws-panel-main">

          <nav className="ws-panel-nav" aria-label="Settings sections">
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={[
                  'ws-panel-nav-item',
                  tab === t.id        ? 'ws-panel-nav-item--active' : '',
                  t.id === 'danger'   ? 'ws-panel-nav-item--danger' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setTab(t.id)}
              >
                <t.Icon size={15} weight={tab === t.id ? 'bold' : 'regular'} aria-hidden="true" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="ws-panel-content">

            {/* ── General ──────────────────────────────────────── */}
            {tab === 'general' && <>

              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">Identity</div>
                <div className="ws-setting-group-body">
                  <form onSubmit={handleRenameWorkspace}>
                    <label className="ws-settings-label" htmlFor="ws-name-input">Workspace name</label>
                    <p className="ws-settings-desc" style={{ marginTop: 3 }}>Appears in the sidebar and across the app.</p>
                    <div className="ws-rename-row" style={{ marginTop: 8 }}>
                      <input id="ws-name-input" type="text" className="ws-rename-input"
                        value={draftName} onChange={e => setDraftName(e.target.value)}
                        placeholder="Workspace name…" maxLength={60}
                        disabled={!isOwner || nameSaving} aria-label="Workspace name" />
                      {isOwner && (
                        <button type="submit" className="btn-primary btn-sm" disabled={!nameChanged || nameSaving}>
                          {nameSaving ? 'Saving…' : 'Rename'}
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">Branding</div>
                <div className="ws-setting-group-body">
                  <p className="ws-settings-desc">Set a color and optional emoji for the sidebar icon.</p>
                  <div className="ws-branding-row">
                    <span className="ws-avatar ws-avatar--lg" style={{ background: currentWorkspace?.color ?? '#2563EB' }} aria-hidden="true">
                      {currentWorkspace?.emoji || currentWorkspace?.name?.charAt(0)?.toUpperCase()}
                    </span>
                    <div className="ws-branding-controls">
                      <div className="ws-branding-swatches" role="group" aria-label="Workspace color">
                        {COLUMN_PRESET_COLORS.map(preset => (
                          <button key={preset} type="button"
                            className={`col-color-swatch${(currentWorkspace?.color ?? '#2563EB') === preset ? ' col-color-swatch--active' : ''}`}
                            style={{ background: preset }}
                            onClick={() => isOwner && handleSetColor(preset)}
                            aria-label={`Color ${preset}`}
                            aria-pressed={(currentWorkspace?.color ?? '#2563EB') === preset}
                            disabled={colorSaving || !isOwner} />
                        ))}
                      </div>
                      <div className="ws-emoji-row">
                        <input type="text" className="ws-emoji-input"
                          value={draftEmoji} onChange={e => setDraftEmoji(e.target.value.slice(0, 4))}
                          onBlur={handleSaveEmoji}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEmoji() } }}
                          placeholder="Emoji (optional)" disabled={emojiSaving || !isOwner} aria-label="Workspace emoji" />
                        {draftEmoji && isOwner && (
                          <button type="button" className="ws-emoji-clear"
                            onClick={() => { setDraftEmoji(''); updateWorkspaceSettings(currentWorkspace.id, { emoji: null }) }}
                            aria-label="Remove emoji">
                            <X size={12} weight="bold" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">Automation</div>
                <div className="ws-setting-group-body">
                  <div className="ws-settings-row">
                    <div className="ws-settings-info">
                      <span className="ws-settings-label">Auto-save task edits</span>
                      <span className="ws-settings-desc">When off, changes require a manual Save.</span>
                    </div>
                    <button className={`toggle-btn${autoSave ? ' toggle-btn--on' : ''}`}
                      onClick={handleToggleAutoSave} disabled={saving || !isOwner}
                      aria-pressed={autoSave} aria-label="Toggle auto-save" />
                  </div>
                  <div className="ws-settings-divider" style={{ margin: '2px 0' }} />
                  <div className="ws-settings-row">
                    <div className="ws-settings-info">
                      <span className="ws-settings-label">Auto-archive done tasks</span>
                      <span className="ws-settings-desc">Move done tasks to archive after a set period.</span>
                    </div>
                    <select className="field-select ws-archive-select"
                      value={autoArchiveDays ?? ''} onChange={e => handleSetAutoArchive(e.target.value)}
                      disabled={archiveSaving || !isOwner} aria-label="Auto-archive period">
                      <option value="">Off</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">Board columns</div>
                <div className="ws-setting-group-body">
                  <p className="ws-settings-desc">Add, rename, or remove columns. Changes apply workspace-wide.</p>
                  <div className="ws-col-rename-list">
                    {draftColumns.map((col, i) => (
                      <div key={col.id} className="ws-col-manager-item">
                        <div className="ws-col-rename-row">
                          <span className="ws-col-rename-index">{i + 1}</span>
                          <input type="text" className="ws-col-rename-input"
                            value={col.label} onChange={e => handleRenameColumn(col.id, e.target.value)}
                            placeholder="Column name" maxLength={30}
                            disabled={!isOwner || colManagerSaving} aria-label={`Column ${i + 1} name`} />
                          {isOwner && (
                            <button className="ws-col-remove-btn" onClick={() => handleRemoveColumn(col.id)}
                              disabled={draftColumns.length <= 1 || colManagerSaving}
                              aria-label={`Remove column ${col.label}`} title="Remove column">
                              <X size={14} weight="bold" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                        {isOwner && (
                          <div className="ws-col-color-row">
                            {COLUMN_PRESET_COLORS.map(preset => (
                              <button key={preset} type="button"
                                className={`col-color-swatch${col.color === preset ? ' col-color-swatch--active' : ''}`}
                                style={{ background: preset }}
                                onClick={() => handleSetColumnColor(col.id, preset)}
                                aria-label={`Column color ${preset}`}
                                aria-pressed={col.color === preset}
                                disabled={colManagerSaving} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {isOwner && (
                    <div className="ws-col-add-row">
                      <input type="text" className="ws-col-rename-input"
                        value={newColLabel} onChange={e => setNewColLabel(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddColumn() } }}
                        placeholder="New column name…" maxLength={30}
                        disabled={colManagerSaving} aria-label="New column name" />
                      <button className="btn-ghost btn-sm" onClick={handleAddColumn}
                        disabled={!newColLabel.trim() || colManagerSaving}>+ Add</button>
                    </div>
                  )}
                  {isOwner && (
                    <button className="btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}
                      disabled={!columnsChanged || colManagerSaving} onClick={handleSaveColumns}>
                      {colManagerSaving ? 'Saving…' : 'Save columns'}
                    </button>
                  )}
                </div>
              </div>

              {currentProject && (
                <div className="ws-setting-group">
                  <div className="ws-setting-group-hdr">Columns — {currentProject.name}</div>
                  <div className="ws-setting-group-body">
                    <p className="ws-settings-desc">Override which columns this project displays.</p>
                    <div className="ws-settings-col-list">
                      {workspaceColumns.map(col => {
                        const enabled = currentProject.enabled_columns ?? workspaceColumns.map(c => c.id)
                        const isOn = enabled.includes(col.id)
                        return (
                          <label key={col.id} className="ws-settings-col-row">
                            <input type="checkbox" checked={isOn}
                              disabled={colSaving || !isOwner} onChange={() => handleToggleColumn(col.id)} />
                            <span>{col.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>}

            {/* ── Members ──────────────────────────────────────── */}
            {tab === 'members' && <>
              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">
                  Team members
                  <span className="ws-setting-group-count">{members.length}</span>
                </div>
                <ul className="ws-members-list" style={{ margin: 0 }}>
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
                        <button className="ws-member-remove" onClick={() => handleRemoveMember(m)}
                          aria-label={`Remove ${memberDisplayName(m)}`}>
                          <X size={14} weight="bold" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {canEdit && (
                <div className="ws-setting-group">
                  <div className="ws-setting-group-hdr">Invite member</div>
                  <div className="ws-setting-group-body">
                    {!inviteLink ? (
                      <form onSubmit={handleInvite} className="ws-invite-form">
                        <input type="email" value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          placeholder="teammate@example.com" required spellCheck={false}
                          className="ws-invite-input" />
                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                          className="field-select ws-invite-role">
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
                          <button className="btn-primary btn-sm" onClick={() => navigator.clipboard.writeText(inviteLink)}>Copy</button>
                        </div>
                        <button className="btn-ghost btn-sm" onClick={() => { setInviteLink(''); setInviteEmail('') }}>
                          Invite another
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>}

            {/* ── Projects ─────────────────────────────────────── */}
            {tab === 'projects' && (
              <div className="ws-setting-group">
                <div className="ws-setting-group-hdr">
                  Projects
                  <span className="ws-setting-group-count">{projects.length}</span>
                </div>
                <ul className="ws-project-list" style={{ margin: 0, padding: 0 }}>
                  {projects.map(p => {
                    const isRenaming   = renamingProject?.id === p.id
                    const isColoring   = coloringProject === p.id
                    return (
                      <li key={p.id} className="ws-project-row">
                        <div className="ws-project-row-main">
                          <span className="ws-project-dot" style={{ background: p.color }} />
                          {isRenaming ? (
                            <input className="ws-project-rename-input"
                              value={renamingProject.name}
                              onChange={e => setRenamingProject(prev => ({ ...prev, name: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleConfirmRenameProject()
                                if (e.key === 'Escape') setRenamingProject(null)
                              }}
                              onBlur={handleConfirmRenameProject}
                              autoFocus maxLength={60} aria-label="Project name" />
                          ) : (
                            <span className="ws-project-name">{p.name}</span>
                          )}
                          <div className="ws-project-actions">
                            {isOwner && !isRenaming && (
                              <button
                                className={`ws-project-icon-btn${isColoring ? ' ws-project-icon-btn--active' : ''}`}
                                onClick={() => setColoringProject(isColoring ? null : p.id)}
                                aria-label={`Change color for ${p.name}`} title="Change color">
                                <Palette size={14} weight={isColoring ? 'fill' : 'bold'} aria-hidden="true" />
                              </button>
                            )}
                            {isOwner && !isRenaming && (
                              <button className="ws-project-icon-btn" onClick={() => handleStartRenameProject(p)}
                                aria-label={`Rename ${p.name}`} title="Rename">
                                <PencilSimple size={14} weight="bold" aria-hidden="true" />
                              </button>
                            )}
                            {isRenaming && (
                              <button className="ws-project-icon-btn ws-project-icon-btn--confirm"
                                onClick={handleConfirmRenameProject} aria-label="Confirm rename">
                                <Check size={14} weight="bold" aria-hidden="true" />
                              </button>
                            )}
                            {isOwner && projects.length > 1 && !isRenaming && (
                              <button className="ws-project-delete" onClick={() => handleDeleteProject(p)}
                                aria-label={`Delete ${p.name}`}>Delete</button>
                            )}
                          </div>
                        </div>
                        {isColoring && (
                          <div className="ws-project-color-picker">
                            {COLUMN_PRESET_COLORS.map(preset => (
                              <button key={preset} type="button"
                                className={`col-color-swatch${p.color === preset ? ' col-color-swatch--active' : ''}`}
                                style={{ background: preset }}
                                onClick={() => handleSetProjectColor(p, preset)}
                                aria-label={`Project color ${preset}`}
                                aria-pressed={p.color === preset} />
                            ))}
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {/* ── Danger ───────────────────────────────────────── */}
            {tab === 'danger' && isOwner && (
              isPersonal
                ? (
                  <div className="ws-setting-group">
                    <div className="ws-setting-group-body">
                      <p className="delete-ws-warning">Your personal workspace cannot be deleted.</p>
                    </div>
                  </div>
                ) : (
                  <div className="ws-setting-group ws-setting-group--danger">
                    <div className="ws-setting-group-hdr ws-setting-group-hdr--danger">Delete workspace</div>
                    <div className="ws-setting-group-body">
                      <p className="delete-ws-warning">
                        Permanently deletes <strong>{currentWorkspace?.name}</strong> and all its tasks,
                        labels, and members. <strong>This cannot be undone.</strong>
                      </p>
                      <p className="ws-settings-desc">Type the word below to confirm:</p>
                      <div className="delete-ws-confirm-word">{confirmWord}</div>
                      <input type="text" className="delete-ws-input"
                        value={typed} onChange={e => setTyped(e.target.value)}
                        placeholder={`Type "${confirmWord}" to confirm`}
                        autoComplete="off" spellCheck={false} />
                      <button className="btn-danger" style={{ alignSelf: 'flex-start', marginTop: 'var(--space-2)' }}
                        disabled={typed !== confirmWord || deleting}
                        onClick={handleDeleteWorkspace}>
                        {deleting ? 'Deleting…' : 'Delete workspace'}
                      </button>
                    </div>
                  </div>
                )
            )}

          </div>
        </div>
      </aside>
    </>
  )
}
