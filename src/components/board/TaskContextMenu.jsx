import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ArrowSquareOut, ArrowRight, Check, X, Copy, Archive, Trash, Camera } from '@phosphor-icons/react'

export default function TaskContextMenu({
  x, y,
  task,
  columns,
  canEdit,
  canDelete,
  onClose,
  onOpen,
  onMoveToStatus,
  onComplete,
  onArchive,
  onDelete,
  onCopyTitle,
  onCopyDescription,
  onScreenshot,
}) {
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    const el = menuRef.current
    if (!el) return
    const { right, bottom } = el.getBoundingClientRect()
    if (right  > window.innerWidth  - 8) el.style.left = (window.innerWidth  - el.offsetWidth  - 8) + 'px'
    if (bottom > window.innerHeight - 8) el.style.top  = (window.innerHeight - el.offsetHeight - 8) + 'px'
  }, [])

  useEffect(() => {
    const onDown   = e => { if (!menuRef.current?.contains(e.target)) onClose() }
    const onKey    = e => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    const onScroll = () => onClose()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, { capture: true })
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, { capture: true })
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [onClose])

  const otherColumns   = columns.filter(c => c.id !== task.status)
  const isDone         = task.status === 'done'
  const firstColumnId  = columns[0]?.id ?? 'toDo'
  const showDangerSep  = (canEdit && onArchive) || (canDelete && onDelete)

  return createPortal(
    <div
      ref={menuRef}
      className="task-ctx-menu"
      style={{ left: x, top: y }}
      role="menu"
      aria-label="Task actions"
    >
      <button className="task-ctx-item" role="menuitem" onClick={onOpen}>
        <ArrowSquareOut size={14} aria-hidden="true" />
        Open task
      </button>

      {canEdit && otherColumns.length > 0 && (
        <>
          <div className="task-ctx-sep" role="separator" />
          <span className="task-ctx-label">Move to</span>
          {otherColumns.map(col => (
            <button
              key={col.id}
              className="task-ctx-item"
              role="menuitem"
              onClick={() => onMoveToStatus(col.id)}
            >
              <ArrowRight size={14} aria-hidden="true" />
              {col.label}
            </button>
          ))}
        </>
      )}

      {canEdit && (
        <>
          <div className="task-ctx-sep" role="separator" />
          {isDone ? (
            <button
              className="task-ctx-item"
              role="menuitem"
              onClick={() => onMoveToStatus(firstColumnId)}
            >
              <X size={14} weight="bold" aria-hidden="true" />
              Mark as not done
            </button>
          ) : (
            <button className="task-ctx-item" role="menuitem" onClick={onComplete}>
              <Check size={14} weight="bold" aria-hidden="true" />
              Mark as done
            </button>
          )}
        </>
      )}

      <div className="task-ctx-sep" role="separator" />
      <button className="task-ctx-item" role="menuitem" onClick={onCopyTitle}>
        <Copy size={14} aria-hidden="true" />
        Copy title
      </button>

      {onCopyDescription && (
        <button className="task-ctx-item" role="menuitem" onClick={onCopyDescription}>
          <Copy size={14} aria-hidden="true" />
          Copy description
        </button>
      )}

      <button className="task-ctx-item" role="menuitem" onClick={onScreenshot}>
        <Camera size={14} aria-hidden="true" />
        Screenshot card
      </button>

      {showDangerSep && <div className="task-ctx-sep" role="separator" />}

      {canEdit && onArchive && (
        <button className="task-ctx-item task-ctx-item--muted" role="menuitem" onClick={onArchive}>
          <Archive size={14} aria-hidden="true" />
          Archive
        </button>
      )}

      {canDelete && onDelete && (
        <button className="task-ctx-item task-ctx-item--danger" role="menuitem" onClick={onDelete}>
          <Trash size={14} aria-hidden="true" />
          Delete
        </button>
      )}
    </div>,
    document.body
  )
}
