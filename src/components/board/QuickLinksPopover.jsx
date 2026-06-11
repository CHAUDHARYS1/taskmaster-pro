import { useEffect, useRef, useState } from 'react'
import { ArrowSquareOut, GridFour, PencilSimple, Plus, X } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'

const MAX = 4

function faviconUrl(href) {
  try {
    const { hostname } = new URL(href)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch { return null }
}

function normalise(url) {
  const s = url.trim()
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

function LinkIcon({ link }) {
  const [failed, setFailed] = useState(false)
  if (link.emoji) return <span className="ql-tile-icon" aria-hidden="true">{link.emoji}</span>
  if (!failed && link.favicon) {
    return (
      <img
        src={link.favicon}
        alt=""
        width="28"
        height="28"
        className="ql-tile-favicon"
        onError={() => setFailed(true)}
      />
    )
  }
  return <ArrowSquareOut size={24} className="ql-tile-icon" aria-hidden="true" />
}

export default function QuickLinksPopover() {
  const { currentWorkspace, updateWorkspaceSettings } = useWorkspace()
  const { toast } = useToast()
  const [open, setOpen]       = useState(false)
  const [editing, setEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl]     = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [saving, setSaving]     = useState(false)
  const containerRef = useRef(null)
  const titleInputRef = useRef(null)

  const links = currentWorkspace?.quick_links ?? []

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false)
        setEditing(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (editing && titleInputRef.current) titleInputRef.current.focus()
  }, [editing])

  const saveLinks = async (updated) => {
    if (!currentWorkspace) return
    setSaving(true)
    try {
      await updateWorkspaceSettings(currentWorkspace.id, { quick_links: updated })
    } catch {
      toast.error('Failed to save link')
    } finally {
      setSaving(false)
    }
  }

  const addLink = async (e) => {
    e.preventDefault()
    if (!newTitle.trim() || !newUrl.trim()) return
    const url = normalise(newUrl)
    const link = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      url,
      emoji: newEmoji.trim() || null,
      favicon: newEmoji.trim() ? null : faviconUrl(url),
    }
    await saveLinks([...links, link])
    setNewTitle('')
    setNewUrl('')
    setNewEmoji('')
  }

  const removeLink = (id) => saveLinks(links.filter(l => l.id !== id))

  const toggleOpen = () => {
    setOpen(v => !v)
    if (open) setEditing(false)
  }

  return (
    <div className="ql-root" ref={containerRef}>
      <button
        className={`ws-settings-btn${open ? ' ql-trigger--active' : ''}`}
        onClick={toggleOpen}
        aria-label="Quick links"
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Quick links"
      >
        <GridFour size={20} weight={open ? 'fill' : 'regular'} aria-hidden="true" />
      </button>

      {open && (
        <div className="ql-popover" role="dialog" aria-label="Quick links">
          <div className="ql-header">
            <span className="ql-title">Quick Links</span>
            <button
              className="ql-edit-btn"
              onClick={() => setEditing(v => !v)}
              aria-pressed={editing}
            >
              <PencilSimple size={13} aria-hidden="true" />
              {editing ? 'Done' : 'Edit'}
            </button>
          </div>

          {links.length === 0 && !editing && (
            <p className="ql-empty">
              No links yet.{' '}
              <button className="ql-empty-cta" onClick={() => setEditing(true)}>Add one</button>
            </p>
          )}

          {links.length > 0 && (
            <div className="ql-grid">
              {links.map(link => (
                <div key={link.id} className={`ql-tile${editing ? ' ql-tile--editing' : ''}`}>
                  {editing && (
                    <button
                      className="ql-remove"
                      onClick={() => removeLink(link.id)}
                      aria-label={`Remove ${link.title}`}
                    >
                      <X size={9} weight="bold" aria-hidden="true" />
                    </button>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ql-tile-link"
                    tabIndex={editing ? -1 : 0}
                    onClick={e => editing && e.preventDefault()}
                    aria-label={`Open ${link.title} in new tab`}
                  >
                    <LinkIcon link={link} />
                    <span className="ql-tile-label">{link.title}</span>
                  </a>
                </div>
              ))}
            </div>
          )}

          {editing && links.length < MAX && (
            <form className="ql-add-form" onSubmit={addLink}>
              <div className="ql-add-row">
                <input
                  className="ql-input ql-input--emoji"
                  placeholder="🔗"
                  value={newEmoji}
                  onChange={e => setNewEmoji(e.target.value)}
                  maxLength={2}
                  aria-label="Emoji (optional)"
                  ref={titleInputRef}
                />
                <input
                  className="ql-input ql-input--title"
                  placeholder="Label"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  aria-label="Link label"
                  required
                />
              </div>
              <div className="ql-add-row">
                <input
                  className="ql-input ql-input--url"
                  placeholder="https://…"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  aria-label="URL"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary ql-add-btn"
                  disabled={!newTitle.trim() || !newUrl.trim() || saving}
                >
                  <Plus size={13} aria-hidden="true" />
                  Add
                </button>
              </div>
            </form>
          )}

          {editing && links.length >= MAX && (
            <p className="ql-max-note">Maximum {MAX} links reached.</p>
          )}
        </div>
      )}
    </div>
  )
}
