import { useState } from 'react'
import { Plus, X } from '@phosphor-icons/react'

const MAX_LINKS   = 2
const STORAGE_KEY = 'tm_quick_links'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

function persist(links) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

function faviconUrl(href) {
  try {
    const { hostname } = new URL(href)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`
  } catch { return null }
}

function normalise(url) {
  const s = url.trim()
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}

function Favicon({ src }) {
  const [failed, setFailed] = useState(false)
  if (failed || !src) return <span className="ql-fallback" aria-hidden="true">↗</span>
  return (
    <img
      src={src}
      alt=""
      width="16"
      height="16"
      className="ql-favicon"
      onError={() => setFailed(true)}
    />
  )
}

export default function QuickLinks() {
  const [links,    setLinks]    = useState(load)
  const [showForm, setShowForm] = useState(false)
  const [title,    setTitle]    = useState('')
  const [url,      setUrl]      = useState('')

  const save = (next) => { setLinks(next); persist(next) }

  const addLink = (e) => {
    e.preventDefault()
    const href = normalise(url)
    save([...links, { id: Date.now(), title: title.trim() || href, url: href, favicon: faviconUrl(href) }])
    setTitle(''); setUrl(''); setShowForm(false)
  }

  const removeLink = (id) => save(links.filter(l => l.id !== id))

  const closeForm = () => { setShowForm(false); setTitle(''); setUrl('') }

  return (
    <>
      {links.map(link => (
        <div key={link.id} className="ql-wrap">
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="ql-btn"
            aria-label={link.title}
          >
            <Favicon src={link.favicon} />
          </a>
          <div className="ql-tooltip" role="tooltip">
            <span className="ql-tooltip-title">{link.title}</span>
            <span className="ql-tooltip-url">{link.url}</span>
          </div>
          <button
            className="ql-remove"
            onClick={() => removeLink(link.id)}
            aria-label={`Remove ${link.title}`}
          >
            <X size={8} weight="bold" aria-hidden="true" />
          </button>
        </div>
      ))}

      {links.length < MAX_LINKS && (
        <button
          className="btn-ghost sidebar-settings-btn ql-add-btn"
          onClick={() => setShowForm(true)}
          aria-label="Add quick link"
          title="Add quick link"
        >
          <Plus size={16} weight="bold" aria-hidden="true" />
        </button>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div
            className="modal-sheet ql-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add quick link"
          >
            <div className="modal-hdr">
              <h2 className="modal-ttl">Add Quick Link</h2>
              <button className="modal-close" onClick={closeForm} aria-label="Close">
                <X size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={addLink}>
              <div className="modal-body">
                <div className="field-block">
                  <label htmlFor="ql-label">Label</label>
                  <input
                    id="ql-label"
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Staging environment…"
                    autoFocus={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
                  />
                </div>
                <div className="field-block">
                  <label htmlFor="ql-url">URL</label>
                  <input
                    id="ql-url"
                    type="text"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://staging.myapp.com"
                    required
                  />
                </div>
              </div>
              <div className="modal-ftr">
                <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!url.trim()}>Add Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
