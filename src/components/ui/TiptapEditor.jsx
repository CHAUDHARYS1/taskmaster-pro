import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextB, TextItalic, ListBullets, ListNumbers } from '@phosphor-icons/react'

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
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.isEmpty ? '' : editor.getHTML())
    },
  })

  // Sync content when the task changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (editor.getHTML() !== (content || '')) {
      editor.commands.setContent(content || '', false)
    }
  }, [content, editor])

  // Sync editable prop
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.setEditable(editable)
  }, [editable, editor])

  return (
    <div
      className={`tiptap-wrap${editable ? ' tiptap-wrap--editable' : ''}`}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
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
        </div>
      )}
      <EditorContent editor={editor} className="tiptap-content" />
    </div>
  )
}
