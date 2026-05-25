import { useMemo, useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProject } from '../../contexts/ProjectContext'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { DEFAULT_COLUMNS } from '../board/Board'

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
  const { currentWorkspace, autoSave, userRole, updateWorkspaceSettings, deleteWorkspace } = useWorkspace()
  const { user }     = useAuth()
  const { projects, currentProject, removeProject, renameProject } = useProject()
  const { members, inviteMember, removeMember } = useMembers(currentWorkspace?.id)
  const { toast }    = useToast()

  const isOwner    = userRole === 'owner'
  const isPersonal = currentWorkspace?.id === user?.id

  const [tab, setTab]       = useState('general')
  const [saving, setSaving] = useState(false)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('member')
  const [inviting,    setInviting]    = useState(false)
  const [inviteLink,  setInviteLink]  = useState('')
  const [inviteError, setInviteError] = useState('')

  const confirmWord = useMemo(() => randomWord(), [])
  const [typed,    setTyped]    = useState('')
  const [deleting, setDeleting] = useState(false)

  const [colSaving, setColSaving] = useState(false)

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
    const enabled = currentProject.enabled_columns ?? DEFAULT_COLUMNS.map(c => c.id)
    const next = enabled.includes(colId)
      ? enabled.filter(id => id !== colId)
      : [...enabled, colId]
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
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
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

              {currentProject && (
                <div className="ws-settings-col-section">
                  <p className="ws-settings-label" style={{ marginTop: 'var(--space-5)' }}>
                    Status columns — <em>{currentProject.name}</em>
                  </p>
                  <p className="ws-settings-desc">Toggle which columns are shown on the board.</p>
                  <div className="ws-settings-col-list">
                    {DEFAULT_COLUMNS.map(col => {
                      const enabled = currentProject.enabled_columns ?? DEFAULT_COLUMNS.map(c => c.id)
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
                        ×
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
                {projects.map(p => (
                  <li key={p.id} className="ws-project-row">
                    <span className="ws-project-dot" style={{ background: p.color }} />
                    <span className="ws-project-name">{p.name}</span>
                    {isOwner && projects.length > 1 && (
                      <button
                        className="ws-project-delete"
                        onClick={() => handleDeleteProject(p)}
                        aria-label={`Delete ${p.name}`}
                      >
                        Delete
                      </button>
                    )}
                  </li>
                ))}
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
