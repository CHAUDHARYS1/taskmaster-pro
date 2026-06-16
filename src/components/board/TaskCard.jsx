import { memo, useCallback, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { DotsSix, Check, ChatCircle, CheckSquare, ArrowsClockwise, Trash } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useAuth } from '../../contexts/AuthContext'

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'task-card--overdue'
  if (diff <= 1) return 'task-card--due-soon'
  return ''
}

function fmtDue(due_date, format = 'relative') {
  const d     = dayjs(due_date)
  const today = dayjs().startOf('day')
  const diff  = d.diff(today, 'day')
  if (format === 'absolute') return d.format('MMM D')
  if (diff ===  0) return 'Today'
  if (diff ===  1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff < 7) return `${diff}d`
  if (diff < -1)  return `${Math.abs(diff)}d ago`
  return d.format('MMM D')
}

function initials(u) {
  if (u.display_name) {
    const parts = u.display_name.trim().split(/\s+/)
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return (u.email ?? '??').split('@')[0].slice(0, 2).toUpperCase()
}

function assigneeDisplayName(u) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return full || u.display_name || u.email?.split('@')[0] || '?'
}

function firstName(u) {
  if (u.display_name) return u.display_name.trim().split(/\s+/)[0]
  return u.email?.split('@')[0] ?? 'Someone'
}

function TaskCard({
  task,
  canEdit = true,
  canDelete = false,
  onDelete,
  onArchive,
  onOpen,
  onComplete,
  isOverlay = false,
  editingUser = null,
  showProject = false,
  bulkMode = false,
  isSelected = false,
  onBulkToggle,
  onMove,
  isFirstColumn = false,
  isLastColumn = false,
  searchQuery = '',
}) {
  const { labelMap } = useLabelsCtx()
  const { workspaceTemplate } = useWorkspace()
  const { prefs } = useAuth()
  const isJobTracker = workspaceTemplate === 'job-tracker'
  const isExpanded   = prefs?.cardDensity === 'expanded'
  const isLockedByOther = editingUser != null && !editingUser.is_self
  const isSelfEditing   = editingUser?.is_self === true
  const glowColor   = isSelfEditing ? 'var(--accent)' : editingUser ? userColor(editingUser.user_id) : null
  const priorityDef = task.priority ? priorityMap[task.priority] : null

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging: isSortableDragging,
  } = useSortable({ id: task.id, disabled: !canEdit || isLockedByOther || isOverlay })

  const style = {
    ...(isOverlay ? {} : { transform: CSS.Transform.toString(transform), transition }),
    ...(glowColor ? { '--editing-color': glowColor } : {}),
  }

  const handleOpen = () => {
    if (swipeX !== 0) { setSwipeX(0); return }
    if (isLockedByOther) return
    if (bulkMode) { onBulkToggle?.(task.id); return }
    onOpen(task.id)
  }

  const checklistTotal = task.task_checklist_items?.length ?? 0
  const checklistDone  = task.task_checklist_items?.filter(i => i.checked).length ?? 0
  const commentCount   = Number(task.comments?.[0]?.count ?? 0)

  const isSearchMatch = searchQuery
    ? (task.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    : false
  const isSearchDimmed = !!searchQuery && !isSearchMatch

  // ── Swipe actions (mobile only) ──────────────────────────────────────────
  const canSwipeDelete = canDelete && !!onDelete && !isOverlay
  const canSwipeDone   = canEdit && !!onComplete && !isOverlay
  const swipeEnabled   = canSwipeDelete || canSwipeDone

  const [swipeX, setSwipeX] = useState(0)
  const touchRef = useRef(null)
  const dirRef   = useRef(null)

  const L_REVEAL = -56   // left-swipe threshold → snap to delete
  const L_MAX    = -76   // fully-revealed delete position
  const R_REVEAL =  56   // right-swipe threshold → snap to done
  const R_MAX    =  76   // fully-revealed done position

  const handleTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    dirRef.current   = null
  }, [])

  const handleTouchMove = useCallback((e) => {
    if (!touchRef.current) return
    const dx = e.touches[0].clientX - touchRef.current.x
    const dy = e.touches[0].clientY - touchRef.current.y
    if (!dirRef.current) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      dirRef.current = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v'
    }
    if (dirRef.current === 'h') {
      if (dx < 0 && canSwipeDelete) {
        e.stopPropagation()
        setSwipeX(Math.max(dx, L_MAX))
      } else if (dx > 0 && canSwipeDone) {
        e.stopPropagation()
        setSwipeX(Math.min(dx, R_MAX))
      }
    }
  }, [canSwipeDelete, canSwipeDone])

  const handleTouchEnd = useCallback(() => {
    if (dirRef.current === 'h') {
      setSwipeX(prev => {
        if (prev < L_REVEAL) return L_MAX
        if (prev > R_REVEAL) return R_MAX
        return 0
      })
    }
    touchRef.current = null
    dirRef.current   = null
  }, [])

  const handleSwipeDelete = useCallback((e) => {
    e.stopPropagation()
    setSwipeX(0)
    onDelete?.(task.id)
  }, [onDelete, task.id])

  const handleSwipeDone = useCallback((e) => {
    e.stopPropagation()
    setSwipeX(0)
    onComplete?.(task.id)
  }, [onComplete, task.id])
  // ─────────────────────────────────────────────────────────────────────────

  const hasFooter = due_or_meta(task, isJobTracker, checklistTotal, commentCount)

  return (
    <li
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={[
        'task-card',
        task.status !== 'done' ? urgencyClass(task.due_date) : '',
        task.status === 'done'            ? 'task-card--done'         : '',
        !isOverlay && isSortableDragging  ? 'task-card--dragging'     : '',
        isOverlay                         ? 'task-card--ghost'        : '',
        isLockedByOther                   ? 'task-card--locked'       : '',
        isSelfEditing                     ? 'task-card--self-editing' : '',
        isSelected                        ? 'task-card--selected'     : '',
        checklistTotal > 0                ? 'has-checklist-bar'       : '',
        isSearchDimmed                    ? 'task-card--dimmed'       : '',
        isSearchMatch                     ? 'task-card--search-match' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleOpen}
      {...(!isOverlay && canEdit && !isLockedByOther ? { ...attributes, ...listeners } : {})}
    >
      {/* Done zone — revealed by right-swipe, left side of card */}
      {canSwipeDone && swipeX > 0 && (
        <button
          className="task-card-done-zone"
          onClick={handleSwipeDone}
          aria-label={task.status === 'done' ? 'Mark as incomplete' : 'Mark as done'}
          tabIndex={-1}
        >
          <Check size={18} weight="bold" aria-hidden="true" />
        </button>
      )}

      {/* Delete zone — revealed by left-swipe, right side of card */}
      {canSwipeDelete && swipeX < 0 && (
        <button
          className="task-card-delete-zone"
          onClick={handleSwipeDelete}
          aria-label="Delete task"
          tabIndex={-1}
        >
          <Trash size={18} weight="bold" aria-hidden="true" />
        </button>
      )}

      {/* Sliding content layer */}
      <div
        className="task-card-swipe-inner"
        style={swipeEnabled ? {
          transform: `translateX(${swipeX}px)`,
          transition: (swipeX === 0 || swipeX === L_MAX || swipeX === R_MAX) ? 'transform 0.22s ease' : 'none',
        } : undefined}
        onTouchStart={swipeEnabled ? handleTouchStart : undefined}
        onTouchMove={swipeEnabled ? handleTouchMove : undefined}
        onTouchEnd={swipeEnabled ? handleTouchEnd : undefined}
      >
      {/* Bulk checkbox OR drag handle */}
      {bulkMode ? (
        <button
          className={`task-bulk-check${isSelected ? ' task-bulk-check--selected' : ''}`}
          onClick={e => { e.stopPropagation(); onBulkToggle?.(task.id) }}
          aria-label={isSelected ? 'Deselect task' : 'Select task'}
          aria-pressed={isSelected}
        >
          {isSelected && <Check size={9} weight="bold" aria-hidden="true" />}
        </button>
      ) : (
        canEdit && !isLockedByOther && (
          <DotsSix size={14} className="task-drag-handle" aria-hidden="true" />
        )
      )}

      {/* Editing lock — badge + tooltip */}
      {isLockedByOther && (
        <>
          <div
            className="task-card-editing-badge"
            style={{ background: glowColor }}
            aria-hidden="true"
          >
            {initials(editingUser)}
          </div>
          <div className="task-card-locked-tooltip" role="tooltip">
            {firstName(editingUser)} is currently editing this
          </div>
        </>
      )}


      {/* Priority chip */}
      {priorityDef && (
        <span
          className="task-priority-chip"
          style={{ '--p-color': priorityDef.color }}
        >
          <span aria-hidden="true">{priorityDef.icon}</span>
          {priorityDef.name}
        </span>
      )}

      {/* Title */}
      <p className="task-text">{task.text}</p>

      {/* Description preview — 2-line clamp */}
      {task.description && (
        <div
          className="task-desc-preview"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      {/* Footer metadata row */}
      {hasFooter && (
        <div className="task-card-footer">
          {/* Left cluster */}
          <div className="task-card-footer-left">
            {!isJobTracker && task.assignee && (
              <span className="task-assignee-name">
                <span
                  className="task-assignee-dot"
                  style={{ background: userColor(task.assignee_id) }}
                  aria-hidden="true"
                />
                {assigneeDisplayName(task.assignee)}
              </span>
            )}
            {showProject && task.project && (
              <span className="task-project-pill" title={task.project.name}>
                <span className="task-project-dot" style={{ background: task.project.color }} aria-hidden="true" />
                {task.project.name}
              </span>
            )}
            {task.labels?.length > 0 && (
              <>
                {task.labels.slice(0, isExpanded ? undefined : 3).map(id => {
                  const label = labelMap[id]
                  if (!label) return null
                  const rgb = `${parseInt(label.color.slice(1,3),16)},${parseInt(label.color.slice(3,5),16)},${parseInt(label.color.slice(5,7),16)}`
                  return (
                    <span
                      key={id}
                      className="label-chip label-chip--sm"
                      style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
                    >
                      {label.name}
                    </span>
                  )
                })}
                {!isExpanded && task.labels.length > 3 && (
                  <span className="label-chip label-chip--sm label-chip--overflow">
                    +{task.labels.length - 3}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Right cluster */}
          <div className="task-card-footer-right">
            {checklistTotal > 0 && (
              <span
                className="task-meta-chip"
                title={`${checklistDone} of ${checklistTotal} done`}
              >
                <CheckSquare size={11} weight={checklistDone === checklistTotal ? 'fill' : 'regular'} aria-hidden="true" />
                {checklistDone}/{checklistTotal}
              </span>
            )}
            {commentCount > 0 && (
              <span
                className="task-meta-chip"
                title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
              >
                <ChatCircle size={11} weight="regular" aria-hidden="true" />
                {commentCount}
              </span>
            )}
            {task.recurrence && (
              <span className="task-meta-chip" title="Recurring task" aria-label="Recurring task">
                <ArrowsClockwise size={11} aria-hidden="true" />
              </span>
            )}
            {task.due_date && (
              <span className="task-due" title={dayjs(task.due_date).format('MMMM D, YYYY')}>
                {fmtDue(task.due_date, prefs?.dateFormat)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Checklist items preview — expanded mode only */}
      {isExpanded && checklistTotal > 0 && (
        <ul className="task-checklist-preview" aria-label="Checklist">
          {task.task_checklist_items
            .slice()
            .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
            .map(item => (
              <li
                key={item.id}
                className={`task-checklist-preview-item${item.checked ? ' task-checklist-preview-item--done' : ''}`}
              >
                <span className="task-checklist-preview-check" aria-hidden="true">
                  {item.checked && <Check size={9} weight="bold" />}
                </span>
                <span className="task-checklist-preview-text">{item.text}</span>
              </li>
            ))}
        </ul>
      )}

      {/* Checklist micro-progress bar — pinned to card's bottom edge */}
      {checklistTotal > 0 && (
        <div className="task-checklist-bar" aria-hidden="true">
          <span
            className="task-checklist-bar-fill"
            style={{ width: `${(checklistDone / checklistTotal) * 100}%` }}
          />
        </div>
      )}
      </div>{/* end .task-card-swipe-inner */}

    </li>
  )
}

function due_or_meta(task, isJobTracker, checklistTotal, commentCount) {
  if (task.due_date) return true
  if (task.recurrence) return true
  if (commentCount > 0) return true
  if (checklistTotal > 0) return true
  if (!isJobTracker && task.assignee) return true
  if (task.project) return true
  if (task.labels?.length > 0) return true
  return false
}

export default memo(TaskCard)
