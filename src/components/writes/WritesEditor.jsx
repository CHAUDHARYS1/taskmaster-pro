import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import {
  TextB, TextItalic, TextStrikethrough,
  ListBullets, ListNumbers,
  Quotes, Minus, Link as LinkIcon, LinkBreak,
  TextHOne, TextHTwo, TextHThree,
  Export,
} from '@phosphor-icons/react'
import { useToast } from '../../contexts/ToastContext'

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

export default function WritesEditor({ doc, onSave, onDelete }) {
  const { toast } = useToast()
  const [title,      setTitle]      = useState(doc.title)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [linkInput,  setLinkInput]  = useState('')
  const [showLink,   setShowLink]   = useState(false)
  const [showExport, setShowExport] = useState(false)

  const saveTimer   = useRef(null)
  const titleRef    = useRef(null)
  const exportRef   = useRef(null)

  // Close export dropdown on outside click
  useEffect(() => {
    if (!showExport) return
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showExport])

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
        await onSave(updates)
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 1200)
  }, [onSave])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: doc.content || '',
    onUpdate: ({ editor }) => {
      schedule({ content: editor.isEmpty ? '' : editor.getHTML() })
    },
  })

  // Sync content when doc changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const incoming = doc.content || ''
    if (editor.getHTML() !== incoming) editor.commands.setContent(incoming, false)
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

          <div className="we-export-wrap" ref={exportRef}>
            <button
              className="btn-ghost we-export-btn"
              onClick={() => setShowExport(v => !v)}
              aria-label="Export document"
              title="Export"
            >
              <Export size={15} aria-hidden="true" />
              Export
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

      {/* Toolbar */}
      <div className="we-toolbar" role="toolbar" aria-label="Formatting">
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label="Title (H1)"><TextHOne size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label="Heading (H2)"><TextHTwo size={15} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label="Subheading (H3)"><TextHThree size={15} /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBold().run()}          active={editor.isActive('bold')}          label="Bold"><TextB size={14} weight="bold" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()}        active={editor.isActive('italic')}        label="Italic"><TextItalic size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()}        active={editor.isActive('strike')}        label="Strikethrough"><TextStrikethrough size={14} /></Btn>
        <Divider />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()}    active={editor.isActive('bulletList')}    label="Bullet list"><ListBullets size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()}   active={editor.isActive('orderedList')}   label="Numbered list"><ListNumbers size={14} /></Btn>
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
    </div>
  )
}
