import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import dayjs from 'dayjs'
import { DotsSix, Check, X, Archive, ChatCircle, CheckSquare, ArrowsClockwise, ArrowLeft, ArrowRight } from '@phosphor-icons/react'
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
    if (isLockedByOther) return
    if (bulkMode) { onBulkToggle?.(task.id); return }
    onOpen(task.id)
  }

  const checklistTotal = task.task_checklist_items?.length ?? 0
  const checklistDone  = task.task_checklist_items?.filter(i => i.checked).length ?? 0
  const commentCount   = Number(task.comments?.[0]?.count ?? 0)

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
      ].filter(Boolean).join(' ')}
      onClick={handleOpen}
      {...(!isOverlay && canEdit && !isLockedByOther ? { ...attributes, ...listeners } : {})}
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

      {/* Actions cluster — top-right, hover only */}
      {((canEdit && onComplete && task.status !== 'done' && !isLockedByOther) ||
        (canEdit && onArchive && !isLockedByOther) ||
        (canDelete && !isLockedByOther)) && (
        <div className="task-card-actions" onClick={e => e.stopPropagation()}>
          {canEdit && onComplete && task.status !== 'done' && !isLockedByOther && (
            <button
              className="task-card-action-btn task-card-action-btn--complete"
              aria-label="Mark as done"
              title="Mark as done"
              onClick={e => { e.stopPropagation(); onComplete(task.id) }}
            >
              <Check size={10} weight="bold" aria-hidden="true" />
            </button>
          )}
          {canEdit && onArchive && !isLockedByOther && (
            <button
              className="task-card-action-btn task-card-action-btn--archive"
              aria-label="Archive task"
              title="Archive task"
              onClick={e => { e.stopPropagation(); onArchive(task.id) }}
            >
              <Archive size={10} weight="bold" aria-hidden="true" />
            </button>
          )}
          {canDelete && !isLockedByOther && (
            <button
              className="task-card-action-btn task-card-action-btn--delete"
              aria-label="Delete task"
              title="Delete task"
              onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            >
              <X size={10} weight="bold" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Priority chip */}
      {priorityDef && (
        <span
          className="task-priority-chip"
          style={{ '--p-color': priorityDef.color, '--p-bg': priorityDef.bg }}
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

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="task-labels">
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
        </div>
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

      {/* Column move arrows — mobile only, hidden on desktop via CSS */}
      {onMove && !isOverlay && !bulkMode && (
        <div className="task-card-move-row">
          <button
            className="task-card-move-btn"
            onClick={e => { e.stopPropagation(); onMove(task.id, task.status, 'prev') }}
            aria-label="Move to previous column"
            disabled={isFirstColumn}
          >
            <ArrowLeft size={15} weight="bold" aria-hidden="true" />
          </button>
          <button
            className="task-card-move-btn"
            onClick={e => { e.stopPropagation(); onMove(task.id, task.status, 'next') }}
            aria-label="Move to next column"
            disabled={isLastColumn}
          >
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
          </button>
        </div>
      )}
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
  return false
}

export default memo(TaskCard)
