import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  ListBullets, ListNumbers, CheckSquare,
  Quotes, Minus, Link as LinkIcon, LinkBreak,
  TextHOne, TextHTwo, TextHThree,
  Export, CheckCircle, CaretDown,
} from '@phosphor-icons/react'
import { fmtDate } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function Btn({ onClick, active, label, children, disabled }) {
  return (
    <button
      type="button"
      className={`we-btn${active ? ' we-btn--active' : ''}${disabled ? ' we-btn--disabled' : ''}`}
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      aria-label={label}
      title={label}
      tabIndex={-1}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="we-divider" aria-hidden="true" />
}

export default function WritesEditor({ doc, onSave, onDelete, onChangeWorkspace, remoteUpdateAvailable, onReloadContent }) {
  const { toast }      = useToast()
  const { workspaces } = useWorkspace()
  const workspace      = workspaces?.find(w => w.id === doc.workspace_id)
  const [title,       setTitle]       = useState(doc.title)
  const [saveStatus,  setSaveStatus]  = useState('saved')
  const [wordCount,   setWordCount]   = useState(0)
  const [linkInput,   setLinkInput]   = useState('')
  const [showLink,    setShowLink]    = useState(false)
  const [showExport,  setShowExport]  = useState(false)
  const [showWsPick,  setShowWsPick]  = useState(false)

  const saveTimer   = useRef(null)
  const titleRef    = useRef(null)
  const exportRef   = useRef(null)
  const wsPickRef   = useRef(null)

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExport])

  // Close workspace picker on outside click
  useEffect(() => {
    if (!showWsPick) return
    const handler = (e) => { if (wsPickRef.current && !wsPickRef.current.contains(e.target)) setShowWsPick(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showWsPick])

  const handleExportPDF = () => {
    setShowExport(false)
    const content = editor?.getHTML() || ''
    const win = window.open('', '_blank')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title || 'Untitled'}</title><style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.8; color: #111; max-width: 700px; margin: 48px auto; padding: 0 40px; }
      h1.doc-title { font-size: 22pt; font-weight: 700; border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 24px; }
      h1 { font-size: 18pt; font-weight: 700; margin: 1.2em 0 0.4em; }
      h2 { font-size: 14pt; font-weight: 600; margin: 1em 0 0.3em; }
      h3 { font-size: 12pt; font-weight: 600; margin: 0.9em 0 0.3em; }
      p  { margin-bottom: 0.75em; }
      ul, ol { padding-left: 1.5em; margin: 0.5em 0 0.75em; }
      li { margin-bottom: 0.2em; }
      blockquote { border-left: 3px solid #888; margin: 0.75em 0; padding: 0.25em 0 0.25em 1em; color: #444; font-style: italic; }
      hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
      a  { color: #1a56db; }
      strong { font-weight: 700; }
      em { font-style: italic; }
      s  { text-decoration: line-through; }
      @media print { body { margin: 0; } }
    </style></head><body>
      <h1 class="doc-title">${title || 'Untitled'}</h1>
      ${content}
    </body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const handleExportGoogleDocs = async () => {
    setShowExport(false)
    const content = editor?.getHTML() || ''
    const fullHtml = `<h1>${title || 'Untitled'}</h1>${content}`
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': new Blob([fullHtml], { type: 'text/html' }) }),
      ])
    } catch {
      // Fallback to plain text if ClipboardItem not supported
      await navigator.clipboard.writeText(`${title || 'Untitled'}\n\n${editor?.getText() || ''}`)
    }
    toast.success('Copied! Go to Google Docs → New doc → Paste (Ctrl+V)')
  }

  // Sync title if doc changes (e.g. switched document)
  useEffect(() => {
    setTitle(doc.title)
    setSaveStatus('saved')
  }, [doc.id])

  const schedule = useCallback((updates) => {
    setSaveStatus('unsaved')
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      try {
        const payload = { ...updates }
        if (updates.content !== undefined) {
          const plain = stripHtml(updates.content)
          payload.preview = plain.slice(0, 200)
        }
        await onSave(payload)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 1200)
  }, [onSave])

  const countWords = (editor) => {
    const text = editor.getText().trim()
    return text ? text.split(/\s+/).length : 0
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: doc.content || '',
    onUpdate: ({ editor }) => {
      setWordCount(countWords(editor))
      schedule({ content: editor.isEmpty ? '' : editor.getHTML() })
    },
  })

  // Sync content when doc changes, recount words, and backfill missing preview
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const incoming = doc.content || ''
    if (editor.getHTML() !== incoming) editor.commands.setContent(incoming, false)
    setWordCount(countWords(editor))
    // Populate preview for docs that existed before the preview column was added
    if (!doc.preview) {
      const text = editor.getText().trim()
      if (text) onSave({ preview: text.slice(0, 200) })
    }
  }, [doc.id, editor])

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    schedule({ title: e.target.value.trim() || 'Untitled' })
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); editor?.commands.focus() }
  }

  const applyLink = () => {
    if (!linkInput.trim()) { editor?.chain().focus().unsetLink().run(); setShowLink(false); return }
    const href = /^https?:\/\//i.test(linkInput) ? linkInput : `https://${linkInput}`
    editor?.chain().focus().setLink({ href }).run()
    setLinkInput('')
    setShowLink(false)
  }

  const handleLinkKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink() }
    if (e.key === 'Escape') { setShowLink(false); setLinkInput('') }
  }

  if (!editor) return null

  return (
    <div className="we-wrap">
      {/* Editor breadcrumb bar */}
      <div className="wr-ed-bar">
        <div className="wr-crumb">
          <div className="wr-crumb-ws-wrap" ref={wsPickRef}>
            {workspace && <span className="dot" style={{ background: workspace.color ?? 'var(--accent)' }} aria-hidden="true" />}
            {onChangeWorkspace ? (
              <button
                className="wr-crumb-ws-btn"
                onClick={() => setShowWsPick(v => !v)}
                aria-label="Change workspace"
                aria-expanded={showWsPick}
              >
                {workspace?.name ?? 'No workspace'}
                <CaretDown size={10} weight="bold" aria-hidden="true" />
              </button>
            ) : (
              workspace && <span>{workspace.name}</span>
            )}
            {showWsPick && (
              <div className="wr-ws-picker wr-ws-picker--crumb" role="listbox" aria-label="Move to workspace">
                <div className="wr-ws-picker-label">Move to…</div>
                {workspaces?.map(ws => (
                  <button
                    key={ws.id}
                    className={`wr-ws-picker-item${ws.id === doc.workspace_id ? ' wr-ws-picker-item--active' : ''}`}
                    role="option"
                    aria-selected={ws.id === doc.workspace_id}
                    onClick={() => { setShowWsPick(false); onChangeWorkspace(ws.id) }}
                  >
                    {ws.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {workspace && <span className="sep">›</span>}
          <strong>Writes</strong>
        </div>
        <div className={`wr-saved${saveStatus === 'saved' ? ' visible' : ''}`}>
          <CheckCircle size={13} weight="fill" aria-hidden="true" />
          Saved
        </div>
        <div className="wr-ed-actions">
          <div className="we-export-wrap" ref={exportRef}>
            <button
              className="wr-ed-btn"
              onClick={() => setShowExport(v => !v)}
              aria-label="Export document"
              title="Export"
            >
              <Export size={15} aria-hidden="true" />
            </button>
            {showExport && (
              <div className="we-export-menu" role="menu">
                <button className="we-export-item" role="menuitem" onClick={handleExportPDF}>
                  PDF
                </button>
                <button className="we-export-item we-export-item--disabled" role="menuitem" disabled title="Coming soon">
                  Google Docs <span className="we-export-soon">soon</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document header */}
      <div className="we-doc-hdr">
        <input
          ref={titleRef}
          className="we-title"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          aria-label="Document title"
        />
        <div className="we-hdr-right">
          <span className={`we-save-status we-save-status--${saveStatus}`}>
            {saveStatus === 'saved'   && 'Saved'}
            {saveStatus === 'saving'  && 'Saving…'}
            {saveStatus === 'unsaved' && 'Unsaved'}
          </span>
          <button
            className="btn-ghost we-delete-btn"
            onClick={onDelete}
            title="Delete document"
            aria-label="Delete document"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Remote update banner */}
      {remoteUpdateAvailable && (
        <div className="we-remote-banner" role="status">
          <span>A workspace member updated this document.</span>
          <button className="we-remote-reload" onClick={onReloadContent}>Reload</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="we-toolbar" role="toolbar" aria-label="Formatting">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()}          active={editor.isActive('bold')}          label="Bold"><TextB size={14} weight="bold" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()}        active={editor.isActive('italic')}        label="Italic"><TextItalic size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()}     active={editor.isActive('underline')}     label="Underline"><TextUnderline size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()}        active={editor.isActive('strike')}        label="Strikethrough"><TextStrikethrough size={14} /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="Title (H1)"><TextHOne size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading (H2)"><TextHTwo size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Subheading (H3)"><TextHThree size={15} /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}    active={editor.isActive('bulletList')}    label="Bullet list"><ListBullets size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}   active={editor.isActive('orderedList')}   label="Numbered list"><ListNumbers size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleTaskList().run()}      active={editor.isActive('taskList')}      label="Checklist"><CheckSquare size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()}    active={editor.isActive('blockquote')}    label="Blockquote"><Quotes size={14} /></Btn>
        <Divider />
        <Btn
          onClick={() => {
            if (editor.isActive('link')) { editor.chain().focus().unsetLink().run() }
            else { setLinkInput(editor.getAttributes('link').href ?? ''); setShowLink(v => !v) }
          }}
          active={editor.isActive('link')}
          label={editor.isActive('link') ? 'Remove link' : 'Add link'}
        >
          {editor.isActive('link') ? <LinkBreak size={14} /> : <LinkIcon size={14} />}
        </Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} label="Horizontal rule"><Minus size={14} /></Btn>
      </div>

      {/* Link input popover */}
      {showLink && (
        <div className="we-link-bar">
          <input
            className="we-link-input"
            value={linkInput}
            onChange={e => setLinkInput(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://example.com"
            autoFocus={typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches}
            aria-label="Link URL"
          />
          <button className="btn-primary btn-sm" onMouseDown={e => { e.preventDefault(); applyLink() }}>Apply</button>
          <button className="btn-ghost btn-sm" onMouseDown={e => { e.preventDefault(); setShowLink(false); setLinkInput('') }}>Cancel</button>
        </div>
      )}

      {/* Editor body */}
      <div className="we-body">
        <EditorContent editor={editor} className="we-content" />
      </div>

      {/* Metadata — bottom-right corner */}
      <div className="wr-meta-bar" aria-label="Document info">
        <span>{fmtDate(doc.updated_at)}</span>
        <span className="wr-meta-sep" aria-hidden="true">·</span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>
    </div>
  )
}
