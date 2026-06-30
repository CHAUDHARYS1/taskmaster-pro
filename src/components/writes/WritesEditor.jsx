import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import {
  TextB, TextItalic, TextUnderline, TextStrikethrough,
  ListBullets, ListNumbers, CheckSquare,
  TextIndent, TextOutdent,
  Quotes, Minus, Link as LinkIcon, LinkBreak,
  TextHOne, TextHTwo, TextHThree,
  Export, CheckCircle, CaretDown, TrashSimple, X, ChatText,
} from '@phosphor-icons/react'
import { fmtDate } from '../../utils/format'
import { useToast } from '../../contexts/ToastContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useMembers } from '../../hooks/useMembers'
import { useAuth } from '../../contexts/AuthContext'
import { userColor } from '../../lib/userColor'
import { useDocCollaboration } from '../../hooks/useDocCollaboration'
import { useYjsCollab } from '../../hooks/useYjsCollab'
import { useDocComments } from '../../hooks/useDocComments'
import { RemoteCursorsExtension } from './RemoteCursorsExtension'
import { CommentMark } from './CommentMark'
import CommentPanel from './CommentPanel'

const MAX_AVATARS = 4

function initials(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  const name = full || m.email?.split('@')[0] || '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

function displayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || 'Unknown'
}

function DocAccessAvatars({ workspaceId, onlineUserIds = new Set() }) {
  const { user } = useAuth()
  const { members } = useMembers(workspaceId)
  const [openId, setOpenId] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!openId) return
    const close = (e) => { if (!wrapRef.current?.contains(e.target)) setOpenId(null) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openId])

  if (!members.length) return null

  const visible  = members.slice(0, MAX_AVATARS)
  const overflow = members.length - MAX_AVATARS

  return (
    <div className="we-access-avatars" ref={wrapRef} aria-label="People with access">
      {visible.map(m => {
        const isSelf   = m.user_id === user?.id
        const isOpen   = openId === m.user_id
        const isOnline = !isSelf && onlineUserIds.has(m.user_id)
        return (
          <div key={m.user_id} className="we-access-avatar-wrap">
            <button
              className={`we-access-avatar${isOnline ? ' we-access-avatar--online' : ''}`}
              style={{ background: userColor(m.user_id) }}
              onClick={() => setOpenId(isOpen ? null : m.user_id)}
              aria-label={displayName(m)}
              aria-expanded={isOpen}
            >
              {initials(m)}
            </button>
            {isOpen && (
              <div className="we-access-tooltip" role="tooltip">
                <span className="we-access-tooltip-name">
                  {displayName(m)}{isSelf && <span className="we-access-you"> (you)</span>}
                </span>
                <span className="we-access-tooltip-email">{m.email}</span>
                <span className="we-access-tooltip-role">{m.role}</span>
                {isOnline && <span className="we-access-tooltip-online">Viewing now</span>}
              </div>
            )}
          </div>
        )
      })}
      {overflow > 0 && (
        <div className="we-access-avatar we-access-avatar--overflow" aria-label={`${overflow} more`}>
          +{overflow}
        </div>
      )}
    </div>
  )
}

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

export default function WritesEditor({ doc, onSave, onDelete, onChangeWorkspace, remoteUpdateAvailable, onReloadContent, inSheet = false, onSheetClose }) {
  const { toast }                          = useToast()
  const { workspaces }                     = useWorkspace()
  const { user: authUser, displayName: authDisplayName } = useAuth()
  const workspace      = workspaces?.find(w => w.id === doc.workspace_id)
  const [title,       setTitle]       = useState(doc.title)
  const [saveStatus,  setSaveStatus]  = useState('saved')
  const [wordCount,   setWordCount]   = useState(0)
  const [linkInput,   setLinkInput]   = useState('')
  const [showLink,    setShowLink]    = useState(false)
  const [linkPopover, setLinkPopover] = useState(null) // { href, x, y }
  const [showExport,        setShowExport]        = useState(false)
  const [showWsPick,        setShowWsPick]        = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCommentPanel,  setShowCommentPanel]  = useState(false)
  const [activeCommentId,  setActiveCommentId]  = useState(null)
  const [addCommentInput,  setAddCommentInput]  = useState('')
  const [showAddComment,   setShowAddComment]   = useState(false)
  const [addCommentPos,    setAddCommentPos]    = useState(null) // { y } for floating btn
  const pendingSelectionRef = useRef(null) // { from, to, text } saved before dialog opens

  const saveTimer       = useRef(null)
  const titleRef        = useRef(null)
  const exportRef       = useRef(null)
  const wsPickRef       = useRef(null)
  const editorShellRef  = useRef(null)
  const initializingRef = useRef(false)

  // Yjs real-time content sync — must be called before useEditor
  const { ydoc, initMode } = useYjsCollab(doc.id, authUser?.id)

  // Comments
  const { comments, addComment, addReply, resolveComment } = useDocComments(doc.id)

  // Members for comment author display
  const { members } = useMembers(doc.workspace_id)

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
      StarterKit.configure({ history: false }), // Yjs owns history
      Collaboration.configure({ document: ydoc }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CommentMark,
      RemoteCursorsExtension,
    ],
    // Content is set via Yjs; don't pass content here
    onUpdate: ({ editor }) => {
      setWordCount(countWords(editor))
    },
  })

  // On mobile, blur the editor after a checkbox is tapped so the keyboard doesn't appear
  useEffect(() => {
    if (!editor) return
    const dom = editor.view.dom
    const onCheckboxClick = (e) => {
      if (e.target?.type === 'checkbox') {
        setTimeout(() => editor.commands.blur(), 50)
      }
    }
    dom.addEventListener('click', onCheckboxClick)
    return () => dom.removeEventListener('click', onCheckboxClick)
  }, [editor])

  // When no peer is connected (first user), initialize ydoc from the saved HTML
  useEffect(() => {
    if (!editor || editor.isDestroyed || initMode !== 'from-html') return
    initializingRef.current = true
    editor.commands.setContent(doc.content || '')
    initializingRef.current = false
    setWordCount(countWords(editor))
    if (!doc.preview) {
      const text = editor.getText().trim()
      if (text) onSave({ preview: text.slice(0, 200) })
    }
  }, [editor, initMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // When ydoc syncs from a peer, update word count once content arrives
  useEffect(() => {
    if (!editor || editor.isDestroyed || initMode !== 'from-yjs') return
    setWordCount(countWords(editor))
  }, [editor, initMode])

  // Save on every LOCAL ydoc change (skip remote updates and our own init)
  useEffect(() => {
    if (!ydoc || !editor) return
    const handler = (update, origin) => {
      if (origin === 'remote' || initializingRef.current) return
      schedule({ content: editor.isEmpty ? '' : editor.getHTML() })
      setWordCount(countWords(editor))
    }
    ydoc.on('update', handler)
    return () => ydoc.off('update', handler)
  }, [ydoc, editor, schedule])

  // Live collaboration — cursor presence and remote cursor rendering
  const { remoteUsers, remoteCursors } = useDocCollaboration(doc.id, editor, authUser, authDisplayName)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.commands.updateRemoteCursors(remoteCursors)
  }, [editor, remoteCursors])

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

  // Show link popover when cursor is inside a linked range
  useEffect(() => {
    if (!editor) return
    const update = () => {
      if (editor.isActive('link')) {
        const href = editor.getAttributes('link').href ?? ''
        const { from } = editor.state.selection
        const coords = editor.view.coordsAtPos(from)
        setLinkPopover({ href, x: coords.left, y: coords.bottom + 8 })
      } else {
        setLinkPopover(null)
      }
    }
    editor.on('selectionUpdate', update)
    return () => editor.off('selectionUpdate', update)
  }, [editor])

  // Track selection for floating add-comment button; detect active comment mark
  useEffect(() => {
    if (!editor) return
    const update = () => {
      const { from, to, empty } = editor.state.selection

      // Floating add-comment button — show when text is selected
      if (!empty && !showAddComment) {
        try {
          const coords = editor.view.coordsAtPos(from)
          setAddCommentPos({ y: coords.top })
        } catch { setAddCommentPos(null) }
      } else if (empty) {
        setAddCommentPos(null)
      }

      // Detect cursor inside a comment mark
      const marks = editor.state.selection.$from.marks()
      const commentMark = marks.find(m => m.type.name === 'comment')
      if (commentMark?.attrs.commentId) {
        setActiveCommentId(commentMark.attrs.commentId)
        setShowCommentPanel(true)
      } else {
        setActiveCommentId(null)
      }
    }
    editor.on('selectionUpdate', update)
    return () => editor.off('selectionUpdate', update)
  }, [editor, showAddComment])

  // Comment handlers
  const handleOpenAddComment = () => {
    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')
    pendingSelectionRef.current = { from, to, text }
    setAddCommentInput('')
    setShowAddComment(true)
    setAddCommentPos(null)
  }

  const handleSubmitComment = async () => {
    const body = addCommentInput.trim()
    if (!body || !authUser) return
    const { from, to, text } = pendingSelectionRef.current ?? {}
    try {
      const comment = await addComment({ quote: text, body, userId: authUser.id })
      // Apply the mark to the selection that was pending
      if (from != null) {
        editor.chain().setTextSelection({ from, to }).setCommentMark(comment.id).run()
      }
      setShowCommentPanel(true)
      setActiveCommentId(comment.id)
    } catch (err) {
      console.error('Failed to add comment', err)
    }
    setShowAddComment(false)
    setAddCommentInput('')
    pendingSelectionRef.current = null
  }

  const handleResolveComment = async (commentId) => {
    if (!authUser) return
    await resolveComment(commentId, authUser.id)
    editor.chain().focus().removeCommentMark(commentId).run()
    if (activeCommentId === commentId) setActiveCommentId(null)
  }

  const handleAddReply = async (commentId, body) => {
    if (!authUser) return
    await addReply(commentId, body, authUser.id)
  }

  if (!editor) return null

  const toolbar = (
    <>
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
        <Btn onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')}   label="Indent"><TextIndent size={14} /></Btn>
        <Btn onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')}   label="Deindent"><TextOutdent size={14} /></Btn>
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
        <Divider />
        <Btn
          onClick={handleOpenAddComment}
          disabled={editor.state.selection.empty}
          active={showCommentPanel}
          label="Add comment"
        >
          <ChatText size={14} />
        </Btn>
      </div>
    </>
  )

  const linkDialog = showLink && (
    <div
      className="we-link-overlay"
      onClick={() => { setShowLink(false); setLinkInput('') }}
      role="dialog"
      aria-modal="true"
      aria-label="Edit link"
    >
      <div className="we-link-dialog" onClick={e => e.stopPropagation()}>
        <p className="we-link-dialog-label">{linkInput ? 'Edit link' : 'Add link'}</p>
        <input
          className="we-link-input"
          value={linkInput}
          onChange={e => setLinkInput(e.target.value)}
          onKeyDown={handleLinkKeyDown}
          placeholder="https://example.com"
          autoFocus
          aria-label="Link URL"
        />
        <div className="we-link-dialog-actions">
          <button className="btn-ghost btn-sm" onMouseDown={e => { e.preventDefault(); setShowLink(false); setLinkInput('') }}>Cancel</button>
          <button className="btn-primary btn-sm" onMouseDown={e => { e.preventDefault(); applyLink() }}>Apply</button>
        </div>
      </div>
    </div>
  )

  const linkPopoverEl = linkPopover && !showLink && (
    <div
      className="we-link-popover"
      style={{ left: Math.min(linkPopover.x, window.innerWidth - 320), top: linkPopover.y }}
      onMouseDown={e => e.preventDefault()}
    >
      <a
        href={linkPopover.href}
        target="_blank"
        rel="noopener noreferrer"
        className="we-link-popover-url"
        title={linkPopover.href}
      >
        {linkPopover.href.replace(/^https?:\/\//, '').slice(0, 40)}
        {linkPopover.href.replace(/^https?:\/\//, '').length > 40 ? '…' : ''}
      </a>
      <div className="we-link-popover-actions">
        <button
          className="we-link-popover-btn"
          onMouseDown={e => {
            e.preventDefault()
            setLinkInput(linkPopover.href)
            setLinkPopover(null)
            setShowLink(true)
          }}
        >Edit</button>
        <button
          className="we-link-popover-btn we-link-popover-btn--remove"
          onMouseDown={e => {
            e.preventDefault()
            editor.chain().focus().unsetLink().run()
            setLinkPopover(null)
          }}
        >Remove</button>
      </div>
    </div>
  )

  // Delete confirmation dialog
  const deleteConfirmDialog = showDeleteConfirm && (
    <div
      className="we-link-overlay"
      onClick={() => setShowDeleteConfirm(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Delete document"
    >
      <div className="we-link-dialog" onClick={e => e.stopPropagation()}>
        <p className="we-link-dialog-label">Delete "{title || 'Untitled'}"?</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-3)', margin: '0 0 var(--space-4)' }}>
          This document will be permanently deleted and cannot be recovered.
        </p>
        <div className="we-link-dialog-actions">
          <button className="btn-ghost btn-sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button
            className="btn-sm"
            style={{ background: '#ef4444', color: '#fff', border: 'none' }}
            onClick={() => { setShowDeleteConfirm(false); onDelete?.(); inSheet && onSheetClose?.() }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )

  // Add-comment dialog (centered overlay, same pattern as link dialog)
  const addCommentDialog = showAddComment && (
    <div
      className="we-link-overlay"
      onClick={() => { setShowAddComment(false); setAddCommentInput('') }}
      role="dialog"
      aria-modal="true"
      aria-label="Add comment"
    >
      <div className="we-link-dialog we-add-comment-dialog" onClick={e => e.stopPropagation()}>
        <p className="we-link-dialog-label">Add a comment</p>
        {pendingSelectionRef.current?.text && (
          <div className="wc-dialog-quote">"{pendingSelectionRef.current.text.slice(0, 100)}{pendingSelectionRef.current.text.length > 100 ? '…' : ''}"</div>
        )}
        <textarea
          className="we-link-input wc-comment-textarea"
          value={addCommentInput}
          onChange={e => setAddCommentInput(e.target.value)}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmitComment() }
            if (e.key === 'Escape') { setShowAddComment(false); setAddCommentInput('') }
          }}
          placeholder="Add a comment… (⌘↵ to post)"
          autoFocus
          rows={3}
          aria-label="Comment text"
        />
        <div className="we-link-dialog-actions">
          <button className="btn-ghost btn-sm" onClick={() => { setShowAddComment(false); setAddCommentInput('') }}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={handleSubmitComment} disabled={!addCommentInput.trim()}>Comment</button>
        </div>
      </div>
    </div>
  )

  // Floating add-comment button — appears in the right margin when text is selected
  const floatingCommentBtn = addCommentPos && !showAddComment && !inSheet && (
    <button
      className="wc-float-btn"
      style={{ top: addCommentPos.y }}
      onMouseDown={e => e.preventDefault()}
      onClick={handleOpenAddComment}
      aria-label="Add comment"
      title="Add comment"
    >
      <ChatText size={15} weight="bold" />
    </button>
  )

  /* ── Sheet layout (mobile editing bottom sheet) ── */
  if (inSheet) {
    return (
      <>
      <div className="we-wrap we-wrap--sheet">
        <div className="doc-sheet-bar">
          <span className="doc-sheet-editing-label">
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'unsaved' ? 'Editing' : 'Saved'}
          </span>
          <div className="doc-sheet-actions">
            <div className="we-export-wrap" ref={exportRef}>
              <button className="doc-sheet-btn" onClick={() => setShowExport(v => !v)} aria-label="Export" title="Export">
                <Export size={16} aria-hidden="true" />
              </button>
              {showExport && (
                <div className="we-export-menu" role="menu">
                  <button className="we-export-item" role="menuitem" onClick={handleExportPDF}>PDF</button>
                  <button className="we-export-item we-export-item--disabled" role="menuitem" disabled>
                    Google Docs <span className="we-export-soon">soon</span>
                  </button>
                </div>
              )}
            </div>
            <button className="doc-sheet-btn" onClick={() => setShowDeleteConfirm(true)} aria-label="Delete document" title="Delete">
              <TrashSimple size={16} aria-hidden="true" />
            </button>
            <button className="doc-sheet-btn" onClick={onSheetClose} aria-label="Close editor">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
        {toolbar}
        <div className="doc-sheet-body doc-sheet-body--edit">
          <input
            ref={titleRef}
            className="doc-sheet-title-input"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            placeholder="Untitled document"
            aria-label="Document title"
          />
          {workspace && <div className="doc-sheet-ws-label">{workspace.name}</div>}
          {remoteUpdateAvailable && (
            <div className="we-remote-banner" role="status">
              <span>A workspace member updated this document.</span>
              <button className="we-remote-reload" onClick={onReloadContent}>Reload</button>
            </div>
          )}
          <div className="we-body" onClick={e => { if (e.target === e.currentTarget) editor?.commands.focus('end') }}>
            <EditorContent editor={editor} className="we-content" />
          </div>
        </div>
      </div>
    )
      {linkDialog}
      {linkPopoverEl}
      {addCommentDialog}
      {deleteConfirmDialog}
      </>
  )
  }

  /* ── Standard desktop / full-screen layout ── */
  return (
    <>
    <div className="we-editor-shell" ref={editorShellRef}>
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
        <DocAccessAvatars
          workspaceId={doc.workspace_id}
          onlineUserIds={new Set(remoteUsers.map(u => u.user_id))}
        />
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
          <button
            className={`wr-ed-btn${showCommentPanel ? ' wr-ed-btn--active' : ''}`}
            onClick={() => setShowCommentPanel(v => !v)}
            aria-label="Toggle comments"
            title={`${showCommentPanel ? 'Hide' : 'Show'} comments${comments.length ? ` (${comments.length})` : ''}`}
          >
            <ChatText size={15} aria-hidden="true" />
            {comments.length > 0 && <span className="wr-ed-btn-badge">{comments.length}</span>}
          </button>
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
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete document"
            aria-label="Delete document"
          >
            <TrashSimple size={15} aria-hidden="true" />
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
      {toolbar}

      {/* Editor body */}
      <div className="we-body" onClick={(e) => { if (e.target === e.currentTarget) editor?.commands.focus('end') }}>
        <EditorContent editor={editor} className="we-content" />
      </div>

      {/* Metadata — bottom-right corner */}
      <div className="wr-meta-bar" aria-label="Document info">
        <span>{fmtDate(doc.updated_at)}</span>
        <span className="wr-meta-sep" aria-hidden="true">·</span>
        <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
      </div>
    </div>{/* end we-wrap */}

    {showCommentPanel && (
      <CommentPanel
        comments={comments}
        members={members}
        activeCommentId={activeCommentId}
        currentUserId={authUser?.id}
        onResolve={handleResolveComment}
        onReply={handleAddReply}
        onClose={() => { setShowCommentPanel(false); setActiveCommentId(null) }}
      />
    )}
    </div>{/* end we-editor-shell */}

    {linkDialog}
    {linkPopoverEl}
    {addCommentDialog}
    {deleteConfirmDialog}
    {floatingCommentBtn}
    </>
  )
}
