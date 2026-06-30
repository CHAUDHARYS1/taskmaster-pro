import { useEffect, useRef, useState } from 'react'
import { CheckCircle, X } from '@phosphor-icons/react'

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function memberName(userId, members) {
  const m = members.find(m => m.user_id === userId)
  if (!m) return 'Unknown'
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || 'Unknown'
}

function Avatar({ userId, members, size = 24 }) {
  const name = memberName(userId, members)
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const hue = [...userId].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <span
      className="wcp-avatar"
      style={{ width: size, height: size, background: `hsl(${hue},55%,55%)` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

function CommentThread({ comment, members, isActive, onResolve, onReply, currentUserId, threadRef }) {
  const [reply, setReply] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isActive) inputRef.current?.focus()
  }, [isActive])

  const handleReply = async () => {
    if (!reply.trim() || submitting) return
    setSubmitting(true)
    try {
      await onReply(comment.id, reply.trim())
      setReply('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleReply() }
    if (e.key === 'Escape') { setReply(''); inputRef.current?.blur() }
  }

  return (
    <div
      ref={threadRef}
      className={`wcp-thread${isActive ? ' wcp-thread--active' : ''}`}
    >
      {/* Quote */}
      {comment.quote && (
        <div className="wcp-quote">"{comment.quote.length > 80 ? comment.quote.slice(0, 80) + '…' : comment.quote}"</div>
      )}

      {/* Messages */}
      <div className="wcp-messages">
        {(comment.comment_messages ?? []).map(msg => (
          <div key={msg.id} className="wcp-msg">
            <Avatar userId={msg.created_by} members={members} size={22} />
            <div className="wcp-msg-body">
              <div className="wcp-msg-meta">
                <span className="wcp-msg-author">{memberName(msg.created_by, members)}</span>
                <span className="wcp-msg-time">{timeAgo(msg.created_at)}</span>
              </div>
              <div className="wcp-msg-text">{msg.body}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="wcp-reply-row">
        <Avatar userId={currentUserId} members={members} size={22} />
        <div className="wcp-reply-input-wrap">
          <textarea
            ref={inputRef}
            className="wcp-reply-input"
            placeholder="Reply… (⌘↵ to send)"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {reply.trim() && (
            <button className="wcp-send-btn" onClick={handleReply} disabled={submitting} aria-label="Send reply">
              ↵
            </button>
          )}
        </div>
      </div>

      {/* Resolve */}
      <button className="wcp-resolve-btn" onClick={() => onResolve(comment.id)}>
        <CheckCircle size={13} weight="bold" aria-hidden="true" />
        Resolve
      </button>
    </div>
  )
}

export default function CommentPanel({ comments, members, activeCommentId, currentUserId, onResolve, onReply, onClose }) {
  const activeRef = useRef(null)

  useEffect(() => {
    if (activeCommentId && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCommentId])

  return (
    <aside className="we-comment-panel" aria-label="Document comments">
      <div className="wcp-header">
        <span className="wcp-title">Comments</span>
        <button className="wcp-close-btn" onClick={onClose} aria-label="Close comments">
          <X size={15} />
        </button>
      </div>

      <div className="wcp-body">
        {comments.length === 0 ? (
          <div className="wcp-empty">
            <p>No comments yet.</p>
            <p>Select text and click the comment button to start a thread.</p>
          </div>
        ) : (
          comments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              members={members}
              isActive={comment.id === activeCommentId}
              onResolve={onResolve}
              onReply={onReply}
              currentUserId={currentUserId}
              threadRef={comment.id === activeCommentId ? activeRef : null}
            />
          ))
        )}
      </div>
    </aside>
  )
}
