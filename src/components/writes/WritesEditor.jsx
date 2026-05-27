import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import {
  TextB, TextItalic, TextStrikethrough,
  ListBullets, ListNumbers,
  Quotes, Minus, Link as LinkIcon, LinkBreak,
  TextHOne, TextHTwo, TextHThree,
} from '@phosphor-icons/react'

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
  const [title,      setTitle]      = useState(doc.title)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [linkInput,  setLinkInput]  = useState('')
  const [showLink,   setShowLink]   = useState(false)

  const saveTimer = useRef(null)
  const titleRef  = useRef(null)

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
            autoFocus
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
