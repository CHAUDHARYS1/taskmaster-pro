import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SettingsModal = lazy(() => import('../components/ui/SettingsModal'))
import {
  ArrowLeft, ArrowUp, ArrowDown, CheckCircle, Sliders, Users, FolderSimple, WarningCircle,
  DotsSixVertical, Trash, PencilSimple, Check, X, PaperPlaneTilt,
  Palette, CaretRight,
} from '@phosphor-icons/react'
import Sidebar from '../components/layout/Sidebar'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useProject } from '../contexts/ProjectContext'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { userColor } from '../lib/userColor'

const SIDEBAR_COLORS = [
  '#6366f1', '#2563EB', '#0ea5e9', '#0f766e',
  '#22c55e', '#d97706', '#ef4444', '#ec4899', '#555555',
]

const PRESET_EMOJI = ['🎯', '📦', '⚡', '✳️', '🌟', '🔥']

const COLUMN_PRESET_COLORS = [
  '#6366f1', '#2563EB', '#0ea5e9', '#0f766e',
  '#22c55e', '#d97706', '#ef4444', '#ec4899',
  '#7c3aed', '#555555',
]

const ROLE_LABELS = { owner: 'Owner', member: 'Member', viewer: 'Viewer' }

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}
function memberInitial(m) {
  if (m.first_name) return m.first_name[0].toUpperCase()
  return (m.email ?? '?')[0].toUpperCase()
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div className="wsp-section-hdr">
      <h1 className="wsp-section-title">{title}</h1>
      {subtitle && <p className="wsp-section-sub">{subtitle}</p>}
    </div>
  )
}

// ── Card ───────────────────────────────────────────────────────────────────
function Card({ icon, title, subtitle, badge, children }) {
  return (
    <div className="wsp-card">
      <div className="wsp-card-hdr">
        <div className="wsp-card-icon" aria-hidden="true">{icon}</div>
        <div className="wsp-card-hdr-text">
          <span className="wsp-card-title">{title}</span>
          {subtitle && <span className="wsp-card-sub">{subtitle}</span>}
        </div>
        {badge != null && <span className="wsp-card-badge">{badge}</span>}
      </div>
      {children && <div className="wsp-card-body">{children}</div>}
    </div>
  )
}

// ── Segmented control ──────────────────────────────────────────────────────
function SegPill({ options, value, onChange, disabled }) {
  return (
    <div className="wsp-seg" role="group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`wsp-seg-btn${value === opt.value ? ' wsp-seg-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── General tab ────────────────────────────────────────────────────────────
// ── Sortable column row ────────────────────────────────────────────────────
function SortableColItem({ col, index, isOwner, colSaving, openColorCol, setOpenColorCol, onRename, onRemove, onSetColor, onMoveUp, onMoveDown, totalCols }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="wsp-col-item">
      <div className="wsp-col-row">
        <span
          className="wsp-col-handle"
          aria-hidden="true"
          {...(isOwner && !colSaving ? { ...attributes, ...listeners } : {})}
          style={{ cursor: isOwner && !colSaving ? 'grab' : 'default' }}
        >
          <DotsSixVertical size={14} />
        </span>
        {isOwner && (
          <div className="wsp-col-arrows" aria-label="Reorder column">
            <button
              type="button"
              className="wsp-col-arrow-btn"
              onClick={() => onMoveUp(col.id)}
              disabled={index === 0 || colSaving}
              aria-label={`Move ${col.label} up`}
            >
              <ArrowUp size={12} weight="bold" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="wsp-col-arrow-btn"
              onClick={() => onMoveDown(col.id)}
              disabled={index === totalCols - 1 || colSaving}
              aria-label={`Move ${col.label} down`}
            >
              <ArrowDown size={12} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )}
        <span className="wsp-col-num">{index + 1}</span>
        <input
          type="text"
          className="wsp-col-name-input"
          value={col.label}
          onChange={e => onRename(col.id, e.target.value)}
          disabled={!isOwner || colSaving}
          maxLength={30}
          aria-label={`Column ${index + 1} name`}
        />
        <button
          type="button"
          className="wsp-col-dot-btn"
          style={{ background: col.color }}
          onClick={() => setOpenColorCol(openColorCol === col.id ? null : col.id)}
          disabled={!isOwner || colSaving}
          aria-label={`Change color for ${col.label}`}
          title="Change color"
        />
        {isOwner && (
          <button
            type="button"
            className="wsp-col-delete-btn"
            onClick={() => onRemove(col.id)}
            disabled={totalCols <= 1 || colSaving}
            aria-label={`Remove column ${col.label}`}
          >
            <Trash size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      {openColorCol === col.id && isOwner && (
        <div className="wsp-col-color-picker" role="group" aria-label="Column color">
          {COLUMN_PRESET_COLORS.map(preset => (
            <button
              key={preset}
              type="button"
              className={`wsp-swatch wsp-swatch--sm${col.color === preset ? ' wsp-swatch--active' : ''}`}
              style={{ background: preset }}
              onClick={() => onSetColor(col.id, preset)}
              aria-label={`Color ${preset}`}
              aria-pressed={col.color === preset}
            >
              {col.color === preset && <Check size={10} weight="bold" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}

function GeneralTab({ workspace, isOwner, workspaceColumns, onSaved }) {
  const { updateWorkspaceSettings, updateColumnLabels, renameWorkspace, autoArchiveDays } = useWorkspace()
  const { toast } = useToast()

  // Identity
  const [draftName, setDraftName] = useState(workspace?.name ?? '')
  const [nameSaving, setNameSaving] = useState(false)
  const nameChanged = draftName.trim() !== '' && draftName.trim() !== workspace?.name

  const handleRenameWorkspace = async (e) => {
    e.preventDefault()
    const trimmed = draftName.trim()
    if (!trimmed || trimmed === workspace?.name) return
    setNameSaving(true)
    try {
      await renameWorkspace(workspace.id, trimmed)
      toast.success('Workspace renamed')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to rename workspace')
    } finally { setNameSaving(false) }
  }

  // Color
  const [colorSaving, setColorSaving] = useState(false)
  const handleSetColor = async (color) => {
    if (color === workspace?.color) return
    setColorSaving(true)
    try {
      await updateWorkspaceSettings(workspace.id, { color })
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to update color')
    } finally { setColorSaving(false) }
  }

  // Emoji
  const [draftEmoji, setDraftEmoji] = useState(workspace?.emoji ?? '')
  const [emojiSaving, setEmojiSaving] = useState(false)
  const handleSaveEmoji = async (val) => {
    const v = val ?? draftEmoji.trim()
    if (v === (workspace?.emoji ?? '')) return
    setEmojiSaving(true)
    try {
      await updateWorkspaceSettings(workspace.id, { emoji: v || null })
      toast.success(v ? 'Emoji updated' : 'Emoji removed')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to update emoji')
    } finally { setEmojiSaving(false) }
  }

  // Auto-archive
  const [archiveSaving, setArchiveSaving] = useState(false)
  const handleSetAutoArchive = async (value) => {
    setArchiveSaving(true)
    try {
      await updateWorkspaceSettings(workspace.id, {
        auto_archive_after_days: value === '' ? null : Number(value),
      })
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to update settings')
    } finally { setArchiveSaving(false) }
  }

  // Columns
  const [draftColumns, setDraftColumns] = useState(() => workspaceColumns.map(c => ({ ...c })))
  const [newColLabel, setNewColLabel] = useState('')
  const [colSaving, setColSaving] = useState(false)
  const [openColorCol, setOpenColorCol] = useState(null)

  const colSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleColDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setDraftColumns(prev => {
      const oldIndex = prev.findIndex(c => c.id === active.id)
      const newIndex = prev.findIndex(c => c.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  const handleMoveUp = (id) => {
    setDraftColumns(prev => {
      const i = prev.findIndex(c => c.id === id)
      if (i <= 0) return prev
      return arrayMove(prev, i, i - 1)
    })
  }

  const handleMoveDown = (id) => {
    setDraftColumns(prev => {
      const i = prev.findIndex(c => c.id === id)
      if (i >= prev.length - 1) return prev
      return arrayMove(prev, i, i + 1)
    })
  }

  useEffect(() => {
    setDraftColumns(workspaceColumns.map(c => ({ ...c })))
  }, [workspace?.id, workspace?.column_labels])

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
    setOpenColorCol(null)
  }

  const handleSaveColumns = async () => {
    if (draftColumns.some(c => !c.label.trim())) { toast.error('All columns need a name'); return }
    const newIds = draftColumns.map(c => c.id)
    const existing = workspace?.column_labels ?? {}
    const metadata = Object.fromEntries(Object.entries(existing).filter(([k]) => k.startsWith('_')))
    const labels = Object.fromEntries(draftColumns.map(c => [c.id, c.label.trim()]))
    const colors = Object.fromEntries(draftColumns.map(c => [c.id, c.color]))
    const toSave = { ...metadata, ...labels, _columns: newIds, _column_colors: colors }
    setColSaving(true)
    try {
      await updateColumnLabels(workspace.id, toSave)
      toast.success('Columns saved')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to save columns')
    } finally { setColSaving(false) }
  }

  const currentColor = workspace?.color ?? '#2563EB'

  return (
    <>
      <SectionHeader
        title="General"
        subtitle="Identity, branding, and the board structure for this workspace."
      />

      {/* ── Identity card ── */}
      <Card
        icon={<Sliders size={16} weight="bold" />}
        title="Workspace Identity"
        subtitle="Name and the icon shown in the sidebar."
      >
        <div className="wsp-identity-layout">
          <div
            className="wsp-identity-avatar"
            style={{ background: currentColor }}
            aria-hidden="true"
          >
            {draftEmoji || workspace?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="wsp-identity-fields">
            <form onSubmit={handleRenameWorkspace} className="wsp-name-form">
              <label className="wsp-field-label" htmlFor="wsp-name-input">WORKSPACE NAME</label>
              <div className="wsp-name-row">
                <input
                  id="wsp-name-input"
                  type="text"
                  className="wsp-text-input"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  placeholder="Workspace name…"
                  maxLength={60}
                  disabled={!isOwner || nameSaving}
                />
                {isOwner && nameChanged && (
                  <button type="submit" className="wsp-btn-primary" disabled={nameSaving}>
                    {nameSaving ? 'Saving…' : 'Rename'}
                  </button>
                )}
              </div>
            </form>

            <div className="wsp-color-section">
              <span className="wsp-field-label">SIDEBAR COLOR</span>
              <div className="wsp-color-swatches" role="group" aria-label="Sidebar color">
                {SIDEBAR_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`wsp-swatch${currentColor === c ? ' wsp-swatch--active' : ''}`}
                    style={{ background: c }}
                    onClick={() => isOwner && handleSetColor(c)}
                    disabled={colorSaving || !isOwner}
                    aria-label={`Color ${c}`}
                    aria-pressed={currentColor === c}
                  >
                    {currentColor === c && <Check size={12} weight="bold" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="wsp-emoji-section">
              <span className="wsp-field-label">ICON EMOJI <span className="wsp-field-optional">optional</span></span>
              <div className="wsp-emoji-row">
                <button
                  type="button"
                  className={`wsp-emoji-preset${!draftEmoji ? ' wsp-emoji-preset--active' : ''}`}
                  onClick={() => { setDraftEmoji(''); handleSaveEmoji('') }}
                  disabled={emojiSaving || !isOwner}
                  aria-pressed={!draftEmoji}
                >
                  Aa
                </button>
                {PRESET_EMOJI.map(em => (
                  <button
                    key={em}
                    type="button"
                    className={`wsp-emoji-preset${draftEmoji === em ? ' wsp-emoji-preset--active' : ''}`}
                    onClick={() => { setDraftEmoji(em); handleSaveEmoji(em) }}
                    disabled={emojiSaving || !isOwner}
                    aria-pressed={draftEmoji === em}
                    aria-label={`Use ${em} emoji`}
                  >
                    {em}
                  </button>
                ))}
                <input
                  type="text"
                  className="wsp-emoji-input"
                  value={draftEmoji}
                  onChange={e => setDraftEmoji(e.target.value.slice(0, 4))}
                  onBlur={() => handleSaveEmoji()}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveEmoji() } }}
                  placeholder="Custom…"
                  disabled={emojiSaving || !isOwner}
                  aria-label="Custom emoji"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Automation card ── */}
      <Card
        icon={<span className="wsp-card-icon-text">↻</span>}
        title="Automation"
        subtitle="Hands-off rules that keep the board tidy."
      >
        <div className="wsp-setting-row">
          <div className="wsp-setting-info">
            <span className="wsp-setting-label">Auto-archive done tasks</span>
            <span className="wsp-setting-desc">Move tasks out of Done into the archive after they've sat for a set period.</span>
          </div>
          <SegPill
            value={autoArchiveDays != null ? String(autoArchiveDays) : ''}
            onChange={handleSetAutoArchive}
            disabled={archiveSaving || !isOwner}
            options={[
              { value: '', label: 'Off' },
              { value: '7', label: '7 days' },
              { value: '14', label: '14 days' },
              { value: '30', label: '30 days' },
            ]}
          />
        </div>
      </Card>

      {/* ── Board columns card ── */}
      <Card
        icon={<DotsSixVertical size={16} weight="bold" />}
        title="Board columns"
        subtitle="Drag to reorder · click the dot to recolor · changes apply workspace-wide."
        badge={`${draftColumns.length} columns`}
      >
        <DndContext sensors={colSensors} collisionDetection={closestCenter} onDragEnd={handleColDragEnd}>
          <SortableContext items={draftColumns.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <ul className="wsp-col-list" aria-label="Board columns">
              {draftColumns.map((col, i) => (
                <SortableColItem
                  key={col.id}
                  col={col}
                  index={i}
                  isOwner={isOwner}
                  colSaving={colSaving}
                  openColorCol={openColorCol}
                  setOpenColorCol={setOpenColorCol}
                  onRename={handleRenameColumn}
                  onRemove={handleRemoveColumn}
                  onSetColor={handleSetColumnColor}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  totalCols={draftColumns.length}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        {/* Add column row */}
        {isOwner && (
          <div className="wsp-col-add-row">
            <span
              className="wsp-col-add-dot"
              style={{ background: COLUMN_PRESET_COLORS[draftColumns.length % COLUMN_PRESET_COLORS.length] }}
              aria-hidden="true"
            />
            <input
              type="text"
              className="wsp-col-add-input"
              value={newColLabel}
              onChange={e => setNewColLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddColumn() } }}
              placeholder="Add a column…"
              maxLength={30}
              disabled={colSaving}
              aria-label="New column name"
            />
            <button
              type="button"
              className="wsp-btn-primary"
              onClick={handleAddColumn}
              disabled={!newColLabel.trim() || colSaving}
            >
              + Add
            </button>
          </div>
        )}

        {isOwner && columnsChanged && (
          <div className="wsp-col-save-row">
            <button
              type="button"
              className="wsp-btn-primary"
              onClick={handleSaveColumns}
              disabled={colSaving}
            >
              {colSaving ? 'Saving…' : 'Save columns'}
            </button>
          </div>
        )}
      </Card>
    </>
  )
}

// ── Swipe-to-reveal row (mobile delete gesture) ────────────────────────────
function SwipeMemberRow({ children, isOpen, onOpen, onClose, onDelete }) {
  const startXRef = useRef(null)
  const startOpenRef = useRef(false)
  const [offset, setOffset] = useState(0)
  const [animate, setAnimate] = useState(false)
  const REVEAL_WIDTH = 72

  useEffect(() => {
    setAnimate(true)
    setOffset(isOpen ? -REVEAL_WIDTH : 0)
  }, [isOpen])

  const handleTouchStart = e => {
    startXRef.current = e.touches[0].clientX
    startOpenRef.current = isOpen
    setAnimate(false)
  }

  const handleTouchMove = e => {
    if (startXRef.current === null) return
    const dx = e.touches[0].clientX - startXRef.current
    const base = startOpenRef.current ? -REVEAL_WIDTH : 0
    setOffset(Math.max(-REVEAL_WIDTH, Math.min(0, base + dx)))
  }

  const handleTouchEnd = () => {
    setAnimate(true)
    if (offset < -(REVEAL_WIDTH / 2)) {
      setOffset(-REVEAL_WIDTH)
      onOpen()
    } else {
      setOffset(0)
      onClose()
    }
    startXRef.current = null
  }

  return (
    <div className="wsp-swipe-wrap">
      <div className="wsp-swipe-action" aria-hidden="true">
        <button className="wsp-swipe-delete-btn" onClick={onDelete} tabIndex={isOpen ? 0 : -1}>
          <Trash size={16} weight="bold" color="#fff" aria-hidden="true" />
        </button>
      </div>
      <div
        className="wsp-swipe-row"
        style={{
          transform: `translateX(${offset}px)`,
          transition: animate ? 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}

// ── Members tab ────────────────────────────────────────────────────────────
function MembersTab({ workspace, isOwner, canEdit, onSaved }) {
  const { members, inviteMember, removeMember } = useMembers(workspace?.id)
  const { user } = useAuth()
  const { toast } = useToast()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [openSwipeId, setOpenSwipeId] = useState(null)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteError, setInviteError] = useState('')

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    try {
      const invite = await inviteMember({ email: inviteEmail, role: inviteRole, workspaceName: workspace?.name })
      setInviteLink(`${window.location.origin}/invite/${invite.token}`)
      toast.success(`Invite sent to ${inviteEmail}`)
      onSaved()
    } catch (err) {
      setInviteError(err.message)
    } finally { setInviting(false) }
  }

  const handleRemoveMember = async (m) => {
    if (!window.confirm(`Remove ${memberDisplayName(m)} from this workspace?`)) return
    try {
      await removeMember(m.user_id)
      toast.success('Member removed')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to remove member')
    }
  }

  return (
    <>
      <SectionHeader
        title="Members"
        subtitle="Who can see and edit this workspace."
      />

      <Card
        icon={<Users size={16} weight="bold" />}
        title="Team members"
        subtitle={`${members.length} ${members.length === 1 ? 'person' : 'people'} in this workspace.`}
      >
        <ul className="wsp-members-list">
          {members.map(m => {
            const isMe = m.user_id === user?.id
            const isOwnerMember = m.role === 'owner'
            const color = userColor(m.user_id ?? '')
            return (
              <SwipeMemberRow
                key={m.user_id}
                isOpen={openSwipeId === m.user_id && isOwner && !isMe && !isOwnerMember}
                onOpen={() => setOpenSwipeId(m.user_id)}
                onClose={() => setOpenSwipeId(null)}
                onDelete={() => { setOpenSwipeId(null); handleRemoveMember(m) }}
              >
                <li className="wsp-member-row">
                  <span
                    className="wsp-member-avatar"
                    style={{ background: color }}
                    aria-hidden="true"
                  >
                    {memberInitial(m)}
                  </span>
                  <div className="wsp-member-info">
                    <span className="wsp-member-name">
                      {memberDisplayName(m)}
                      {isMe && <span className="wsp-member-you"> (you)</span>}
                    </span>
                    <span className="wsp-member-email">{m.email}</span>
                  </div>
                  {isOwnerMember
                    ? <span className="wsp-member-badge">OWNER</span>
                    : isOwner && !isMe && (
                      <>
                        <span className="wsp-member-role-label">{ROLE_LABELS[m.role] ?? m.role}</span>
                        <button
                          className="wsp-member-remove"
                          onClick={() => handleRemoveMember(m)}
                          aria-label={`Remove ${memberDisplayName(m)}`}
                        >
                          <X size={14} weight="bold" aria-hidden="true" />
                        </button>
                      </>
                    )
                  }
                </li>
              </SwipeMemberRow>
            )
          })}
        </ul>
      </Card>

      {canEdit && (
        <Card
          icon={<PaperPlaneTilt size={16} weight="bold" />}
          title="Invite a teammate"
          subtitle="They'll get an email link to join."
        >
          {!inviteLink ? (
            <form onSubmit={handleInvite} className="wsp-invite-form">
              <div className="wsp-invite-row">
                <input
                  type="email"
                  className="wsp-text-input wsp-invite-email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                  required
                  spellCheck={false}
                />
                <select
                  className="wsp-select wsp-invite-role"
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  type="submit"
                  className="wsp-btn-primary wsp-invite-btn"
                  disabled={inviting || !inviteEmail}
                >
                  <PaperPlaneTilt size={14} aria-hidden="true" />
                  {inviting ? 'Sending…' : 'Send invite'}
                </button>
              </div>
              {inviteError && <p className="wsp-form-error">{inviteError}</p>}
            </form>
          ) : (
            <div className="wsp-invite-success">
              <p className="wsp-invite-success-msg">Invite sent to {inviteEmail}!</p>
              <p className="wsp-invite-hint">Share this backup link — expires in 7 days.</p>
              <div className="wsp-invite-link-row">
                <input type="text" value={inviteLink} readOnly className="wsp-text-input" />
                <button
                  type="button"
                  className="wsp-btn-primary"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                className="wsp-btn-ghost"
                onClick={() => { setInviteLink(''); setInviteEmail('') }}
              >
                Invite another
              </button>
            </div>
          )}
        </Card>
      )}
    </>
  )
}

// ── Projects tab ───────────────────────────────────────────────────────────
function ProjectsTab({ workspace, isOwner, onSaved }) {
  const { projects, removeProject, renameProject } = useProject()
  const { toast } = useToast()

  const [renamingProject, setRenamingProject] = useState(null)
  const [coloringProject, setColoringProject] = useState(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleConfirmRename = async () => {
    if (!renamingProject) return
    const trimmed = renamingProject.name.trim()
    if (!trimmed) { setRenamingProject(null); return }
    try {
      await renameProject(renamingProject.id, trimmed)
      toast.success('Project renamed')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to rename project')
    } finally { setRenamingProject(null) }
  }

  const handleSetProjectColor = async (p, color) => {
    setColoringProject(null)
    try {
      await renameProject(p.id, p.name, { color })
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to update color')
    }
  }

  const handleDeleteProject = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? All tasks in this project will be permanently deleted.`)) return
    try {
      await removeProject(p.id)
      toast.success(`"${p.name}" deleted`)
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Failed to delete project')
    }
  }

  const handleAddProject = async (e) => {
    e.preventDefault()
    const trimmed = newProjectName.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      // Use renameProject with a dummy ID won't work — check if we have a createProject
      toast.info('Use the sidebar to add projects')
    } catch (err) {
      toast.error(err.message || 'Failed to add project')
    } finally {
      setAdding(false)
      setNewProjectName('')
    }
  }

  return (
    <>
      <SectionHeader
        title="Projects"
        subtitle="Group tasks into projects. Each gets a color used across the board, list, and calendar."
      />

      <Card
        icon={<FolderSimple size={16} weight="bold" />}
        title="All projects"
        subtitle="Click the dot to recolor · pencil to rename."
        badge={`${projects.length} projects`}
      >
        <ul className="wsp-project-list">
          {projects.map(p => {
            const isRenaming = renamingProject?.id === p.id
            const isColoring = coloringProject === p.id
            return (
              <li key={p.id} className="wsp-project-item">
                <div className="wsp-project-row">
                  <button
                    type="button"
                    className={`wsp-project-dot-btn${isColoring ? ' wsp-project-dot-btn--active' : ''}`}
                    style={{ background: p.color || '#6366f1' }}
                    onClick={() => isOwner && setColoringProject(isColoring ? null : p.id)}
                    disabled={!isOwner}
                    aria-label={`Change color for ${p.name}`}
                    title="Change color"
                  />
                  {isRenaming ? (
                    <input
                      className="wsp-project-rename-input"
                      value={renamingProject.name}
                      onChange={e => setRenamingProject(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleConfirmRename()
                        if (e.key === 'Escape') setRenamingProject(null)
                      }}
                      onBlur={handleConfirmRename}
                      autoFocus
                      maxLength={60}
                    />
                  ) : (
                    <span className="wsp-project-name">{p.name}</span>
                  )}
                  <div className="wsp-project-actions">
                    {isOwner && !isRenaming && (
                      <button
                        type="button"
                        className="wsp-icon-btn"
                        onClick={() => setRenamingProject({ id: p.id, name: p.name })}
                        aria-label={`Rename ${p.name}`}
                        title="Rename"
                      >
                        <PencilSimple size={14} aria-hidden="true" />
                      </button>
                    )}
                    {isRenaming && (
                      <button
                        type="button"
                        className="wsp-icon-btn wsp-icon-btn--confirm"
                        onClick={handleConfirmRename}
                        aria-label="Confirm rename"
                      >
                        <Check size={14} aria-hidden="true" />
                      </button>
                    )}
                    {isOwner && projects.length > 1 && !isRenaming && (
                      <button
                        type="button"
                        className="wsp-icon-btn wsp-icon-btn--danger"
                        onClick={() => handleDeleteProject(p)}
                        aria-label={`Delete ${p.name}`}
                        title="Delete project"
                      >
                        <Trash size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
                {isColoring && (
                  <div className="wsp-col-color-picker" role="group" aria-label="Project color">
                    {COLUMN_PRESET_COLORS.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        className={`wsp-swatch wsp-swatch--sm${(p.color || '#6366f1') === preset ? ' wsp-swatch--active' : ''}`}
                        style={{ background: preset }}
                        onClick={() => handleSetProjectColor(p, preset)}
                        aria-label={`Color ${preset}`}
                        aria-pressed={(p.color || '#6366f1') === preset}
                      >
                        {(p.color || '#6366f1') === preset && <Check size={10} weight="bold" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}

// ── Danger tab ─────────────────────────────────────────────────────────────
function DangerTab({ workspace, isOwner, onClose }) {
  const { deleteWorkspace } = useWorkspace()
  const { toast } = useToast()

  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const confirmTarget = workspace?.name ?? ''

  const handleDeleteWorkspace = async () => {
    if (typed !== confirmTarget || deleting) return
    setDeleting(true)
    try {
      await deleteWorkspace(workspace.id)
      toast.success(`"${workspace.name}" deleted`)
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to delete workspace')
      setDeleting(false)
    }
  }

  if (!isOwner) return (
    <div className="wsp-danger-container">
      <SectionHeader title="Danger zone" subtitle="Irreversible and destructive actions. Proceed carefully." />
      <div className="wsp-danger-row">
        <div className="wsp-danger-info">
          <span className="wsp-danger-action-title">Leave workspace</span>
          <span className="wsp-danger-action-desc">Remove yourself from this workspace. You'll lose access until you're re-invited.</span>
        </div>
        <button type="button" className="wsp-btn-outline" disabled>Leave</button>
      </div>
    </div>
  )

  return (
    <div className="wsp-danger-container">
      <SectionHeader title="Danger zone" subtitle="Irreversible and destructive actions. Proceed carefully." />

      <div className="wsp-danger-card">
        <div className="wsp-danger-row">
          <div className="wsp-danger-info">
            <span className="wsp-danger-action-title">Leave workspace</span>
            <span className="wsp-danger-action-desc">Remove yourself from this workspace. You'll lose access until you're re-invited.</span>
          </div>
          <button type="button" className="wsp-btn-outline">Leave</button>
        </div>

        <div className="wsp-danger-divider" />

        <div className="wsp-danger-row">
          <div className="wsp-danger-info">
            <span className="wsp-danger-action-title">Transfer ownership</span>
            <span className="wsp-danger-action-desc">Hand the owner role to another member. You'll become an admin.</span>
          </div>
          <button type="button" className="wsp-btn-outline">Transfer</button>
        </div>

        <div className="wsp-danger-divider" />

        <div className="wsp-danger-delete-section">
          <div className="wsp-danger-row">
            <div className="wsp-danger-info">
              <span className="wsp-danger-action-title">Delete this workspace</span>
              <span className="wsp-danger-action-desc">
                Permanently delete <strong>{workspace?.name}</strong> and all of its boards, tasks, and history. This cannot be undone.
              </span>
            </div>
          </div>
          <div className="wsp-danger-confirm-row">
            <input
              type="text"
              className="wsp-text-input wsp-danger-input"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={`Type "${confirmTarget}" to confirm`}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="wsp-btn-danger"
              disabled={typed !== confirmTarget || deleting}
              onClick={handleDeleteWorkspace}
            >
              <Trash size={14} aria-hidden="true" />
              {deleting ? 'Deleting…' : 'Delete workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────
export default function WorkspaceSettingsPage() {
  const navigate = useNavigate()
  const { currentWorkspace, userRole, workspaceColumns } = useWorkspace()
  const { toast } = useToast()

  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [showUserSettings, setShowUserSettings] = useState(false)
  const [tab, setTab] = useState('general')
  const [savedAt, setSavedAt] = useState(null)
  const [navCollapsed, setNavCollapsed] = useState(
    () => localStorage.getItem('wsp-nav-collapsed') === 'true'
  )
  const [mobileShowIndex, setMobileShowIndex] = useState(true)
  const { members } = useMembers(currentWorkspace?.id)
  const { projects } = useProject()

  const isOwner = userRole === 'owner'
  const canEdit = userRole === 'owner' || userRole === 'member'

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  const handleBack = () => navigate('/app')

  const handleSaved = () => setSavedAt(Date.now())

  const TABS = [
    { id: 'general',  label: 'General',     Icon: Sliders,       description: 'Name, branding, columns', iconBg: '#7c3aed' },
    { id: 'members',  label: 'Members',     Icon: Users,         description: 'People & invites',        iconBg: '#0f766e' },
    { id: 'projects', label: 'Projects',    Icon: FolderSimple,  description: 'Groups & colors',         iconBg: '#d97706' },
    ...(isOwner ? [{ id: 'danger', label: 'Danger zone', Icon: WarningCircle, description: 'Leave or delete', iconBg: '#ef4444' }] : []),
  ]

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar
        isOpen={showSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onProfileClick={() => setShowUserSettings(true)}
      />

      <main className={`wsp-page${mobileShowIndex ? ' wsp-page--mob-idx' : ''}`} id="main-content">
        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="wsp-topbar">
          {/* Desktop back — hidden on mobile */}
          <button className="wsp-back-btn wsp-back-btn--desktop" onClick={handleBack} aria-label="Back to board">
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
            Back to board
          </button>

          {/* Mobile back — hidden on desktop */}
          <button
            className="wsp-back-btn wsp-back-btn--mobile"
            onClick={() => mobileShowIndex ? handleBack() : setMobileShowIndex(true)}
            aria-label={mobileShowIndex ? 'Back to board' : 'Back to settings'}
          >
            <ArrowLeft size={16} weight="bold" aria-hidden="true" />
          </button>

          {/* Mobile page title — hidden on desktop */}
          <div className="wsp-topbar-mob-title">
            <span className="wsp-topbar-mob-main">
              {mobileShowIndex ? 'Settings' : (TABS.find(t => t.id === tab)?.label ?? 'Settings')}
            </span>
            {currentWorkspace && (
              <span className="wsp-topbar-mob-sub">{currentWorkspace.name}</span>
            )}
          </div>

          {currentWorkspace && (
            <div className="wsp-topbar-identity">
              <div
                className="wsp-topbar-avatar"
                style={{ background: currentWorkspace.color ?? 'var(--accent)' }}
                aria-hidden="true"
              >
                {currentWorkspace.emoji || currentWorkspace.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="wsp-topbar-text">
                <span className="wsp-topbar-super">WORKSPACE SETTINGS</span>
                <span className="wsp-topbar-wsname">{currentWorkspace.name}</span>
              </div>
            </div>
          )}

          <div className="wsp-topbar-status" aria-live="polite">
            {savedAt != null && (
              <>
                <CheckCircle size={16} weight="fill" className="wsp-topbar-status-icon" aria-hidden="true" />
                All changes saved
              </>
            )}
          </div>
        </div>

        {/* ── Panels wrapper (enables sliding transition on mobile) */}
        <div className="wsp-mob-panels">

        {/* ── Mobile index ────────────────────────────────────── */}
        <div className="wsp-mobile-index" aria-label="Settings sections">
          {currentWorkspace && (
            <div className="wsp-mob-ws-card">
              <div
                className="wsp-mob-ws-avatar"
                style={{ background: currentWorkspace.color ?? 'var(--accent)' }}
                aria-hidden="true"
              >
                {currentWorkspace.emoji || currentWorkspace.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="wsp-mob-ws-info">
                <span className="wsp-mob-ws-name">{currentWorkspace.name}</span>
                <span className="wsp-mob-ws-meta">
                  {members.length} {members.length === 1 ? 'member' : 'members'} · {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                </span>
              </div>
            </div>
          )}

          <nav className="wsp-mob-sections" aria-label="Settings sections">
            {TABS.map(t => {
              const count =
                t.id === 'members' ? members.length :
                t.id === 'projects' ? projects.length :
                null
              return (
                <button
                  key={t.id}
                  className={`wsp-mob-section-row${t.id === 'danger' ? ' wsp-mob-section-row--danger' : ''}`}
                  onClick={() => { setTab(t.id); setMobileShowIndex(false) }}
                >
                  <span className="wsp-mob-section-icon" style={{ background: t.iconBg }} aria-hidden="true">
                    <t.Icon size={18} weight="bold" color="#fff" aria-hidden="true" />
                  </span>
                  <span className="wsp-mob-section-info">
                    <span className="wsp-mob-section-label">{t.label}</span>
                    <span className="wsp-mob-section-desc">{t.description}</span>
                  </span>
                  {count != null && (
                    <span className="wsp-mob-section-count">{count}</span>
                  )}
                  <CaretRight size={14} weight="bold" className="wsp-mob-section-caret" aria-hidden="true" />
                </button>
              )
            })}
          </nav>

          <p className="wsp-mob-index-footer">
            Changes apply to everyone in this workspace and save automatically.
          </p>
        </div>

        {/* ── Body: nav + content ─────────────────────────────── */}
        <div className="wsp-layout">

          {/* Settings nav */}
          <nav
            className={`wsp-nav${navCollapsed ? ' wsp-nav--collapsed' : ''}`}
            aria-label="Settings sections"
          >
            <span className="wsp-nav-label">SETTINGS</span>
            {TABS.map(t => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                title={navCollapsed ? t.label : undefined}
                className={[
                  'wsp-nav-item',
                  tab === t.id ? 'wsp-nav-item--active' : '',
                  t.id === 'danger' ? 'wsp-nav-item--danger' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setTab(t.id)}
              >
                <t.Icon
                  size={15}
                  weight={tab === t.id ? 'bold' : 'regular'}
                  aria-hidden="true"
                />
                <span>{t.label}</span>
              </button>
            ))}
          </nav>

          {/* Collapse toggle — sits on the border between nav and content */}
          <button
            className={`wsp-nav-toggle${navCollapsed ? ' wsp-nav-toggle--collapsed' : ''}`}
            onClick={() => setNavCollapsed(p => {
              const next = !p
              localStorage.setItem('wsp-nav-collapsed', next)
              return next
            })}
            aria-label={navCollapsed ? 'Expand settings navigation' : 'Collapse settings navigation'}
            title={navCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <CaretRight size={12} weight="bold" className="wsp-nav-toggle-icon" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="wsp-content">
            {tab === 'general' && (
              <GeneralTab
                workspace={currentWorkspace}
                isOwner={isOwner}
                workspaceColumns={workspaceColumns}
                onSaved={handleSaved}
              />
            )}
            {tab === 'members' && (
              <MembersTab
                workspace={currentWorkspace}
                isOwner={isOwner}
                canEdit={canEdit}
                onSaved={handleSaved}
              />
            )}
            {tab === 'projects' && (
              <ProjectsTab
                workspace={currentWorkspace}
                isOwner={isOwner}
                onSaved={handleSaved}
              />
            )}
            {tab === 'danger' && isOwner && (
              <DangerTab
                workspace={currentWorkspace}
                isOwner={isOwner}
                onClose={handleBack}
              />
            )}
          </div>
        </div>

        </div>{/* end wsp-mob-panels */}
      </main>

      <Suspense fallback={null}>
        {showUserSettings && <SettingsModal onClose={() => setShowUserSettings(false)} />}
      </Suspense>
    </div>
  )
}
