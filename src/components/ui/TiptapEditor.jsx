import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { TextB, TextItalic, ListBullets, ListNumbers, LinkSimple } from '@phosphor-icons/react'

function ToolbarBtn({ onClick, active, label, children }) {
  return (
    <button
      type="button"
      className={`tiptap-btn${active ? ' tiptap-btn--active' : ''}`}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

export default function TiptapEditor({ content, onChange, onBlur, editable = true }) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl]             = useState('')
  const linkInputRef                      = useRef(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (editor.getHTML() !== (content || '')) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(editable)
  }, [editable, editor])

  useEffect(() => {
    if (showLinkInput) linkInputRef.current?.focus()
  }, [showLinkInput])

  const isOnLink = editor?.isActive('link')

  const openLinkInput = () => {
    const existing = editor?.getAttributes('link').href ?? ''
    setLinkUrl(existing)
    setShowLinkInput(true)
  }

  const applyLink = () => {
    const url = linkUrl.trim()
    if (!url) {
      editor?.chain().focus().unsetLink().run()
    } else {
      const href = /^https?:\/\//.test(url) ? url : `https://${url}`
      editor?.chain().focus().setLink({ href }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const handleLinkKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); applyLink() }
    if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl('') }
  }

  return (
    <div
      className={`tiptap-wrap${editable ? ' tiptap-wrap--editable' : ''}`}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setShowLinkInput(false)
          setLinkUrl('')
          onBlur?.(editor?.isEmpty ? '' : editor?.getHTML() ?? '')
        }
      }}
    >
      {editable && (
        <div className="tiptap-toolbar">
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
            label="Bold"
          >
            <TextB size={13} weight="bold" />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
            label="Italic"
          >
            <TextItalic size={13} />
          </ToolbarBtn>
          <span className="tiptap-divider" />
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            label="Bullet list"
          >
            <ListBullets size={13} />
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            label="Numbered list"
          >
            <ListNumbers size={13} />
          </ToolbarBtn>
          <span className="tiptap-divider" />
          <ToolbarBtn
            onClick={showLinkInput ? () => { setShowLinkInput(false); setLinkUrl('') } : openLinkInput}
            active={isOnLink || showLinkInput}
            label={isOnLink ? 'Edit link' : 'Add link'}
          >
            <LinkSimple size={13} />
          </ToolbarBtn>
        </div>
      )}

      {editable && showLinkInput && (
        <div className="tiptap-link-row">
          <input
            ref={linkInputRef}
            type="url"
            className="tiptap-link-input"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={handleLinkKeyDown}
            placeholder="https://…"
            aria-label="Link URL"
          />
          <button type="button" className="tiptap-link-apply" onMouseDown={e => { e.preventDefault(); applyLink() }}>
            Apply
          </button>
          <button
            type="button"
            className="tiptap-link-cancel"
            onMouseDown={e => { e.preventDefault(); setShowLinkInput(false); setLinkUrl('') }}
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  )
}
