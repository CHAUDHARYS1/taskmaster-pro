import dayjs from 'dayjs'
import { Check, X } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'

const DEFAULT_COLS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

function urgencyClass(due_date) {
  if (!due_date) return ''
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'list-row--overdue'
  if (diff <= 1) return 'list-row--due-soon'
  return ''
}

function displayName(u) {
  if (!u) return null
  if (u.first_name || u.last_name) {
    return [u.first_name, u.last_name].filter(Boolean).join(' ')
  }
  return u.email?.split('@')[0] ?? null
}

export default function ListView({ columns = DEFAULT_COLS, tasksByStatus, canEdit, canDelete, onDelete, onOpen, onComplete, editingMap, showProject }) {
  const { labelMap } = useLabelsCtx()
  const allTasks = columns.flatMap(col =>
    (tasksByStatus[col.id] ?? []).map(t => ({ ...t, _colLabel: col.label }))
  )

  if (allTasks.length === 0) return (
    <div className="list-empty">No tasks yet.</div>
  )

  return (
    <div className="list-view">
      <table className="list-table">
        <thead>
          <tr className="list-thead-row">
            <th className="list-th list-th--title">Task</th>
            {showProject && <th className="list-th">Project</th>}
            <th className="list-th">Status</th>
            <th className="list-th">Priority</th>
            <th className="list-th">Assignee</th>
            <th className="list-th">Due</th>
            <th className="list-th">Labels</th>
            {(canEdit || canDelete) && <th className="list-th list-th--action" />}
          </tr>
        </thead>
        <tbody>
          {allTasks.map(task => {
            const p   = task.priority ? priorityMap[task.priority] : null
            const editingUser     = editingMap?.[task.id]
            const isLockedByOther = editingUser != null && !editingUser.is_self
            const isSelfEditing   = editingUser?.is_self === true
            const glowColor       = editingUser ? userColor(editingUser.user_id) : null

            return (
              <tr
                key={task.id}
                className={[
                  'list-row',
                  task.status !== 'done' ? urgencyClass(task.due_date) : '',
                  isLockedByOther ? 'list-row--editing'      : '',
                  isSelfEditing   ? 'list-row--self-editing' : '',
                ].filter(Boolean).join(' ')}
                style={glowColor ? { '--editing-color': glowColor } : undefined}
                onClick={() => onOpen(task.id)}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(task.id) } }}
                role="button"
                aria-label={`Open task: ${task.text}`}
              >
                <td className="list-td list-td--title">
                  {isLockedByOther && (
                    <span
                      className="list-editing-badge"
                      style={{ background: glowColor }}
                      title={`${editingUser.display_name || editingUser.email} is editing`}
                    >
                      {(editingUser.display_name || editingUser.email || '?')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="list-task-text">{task.text}</span>
                  {task.description && (
                    <div
                      className="list-task-desc"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  )}
                </td>

                {showProject && (
                  <td className="list-td">
                    {task.project ? (
                      <div className="task-project-badge">
                        <span className="task-project-dot" style={{ background: task.project.color }} aria-hidden="true" />
                        <span>{task.project.name}</span>
                      </div>
                    ) : <span className="list-empty-cell">—</span>}
                  </td>
                )}

                <td className="list-td">
                  <span className="list-status-pill">{task._colLabel}</span>
                </td>

                <td className="list-td">
                  {p ? (
                    <span
                      className="task-priority-badge"
                      style={{ '--p-color': p.color, '--p-bg': p.bg }}
                    >
                      {p.icon} {p.name}
                    </span>
                  ) : <span className="list-empty-cell">—</span>}
                </td>

                <td className="list-td">
                  {task.assignee
                    ? <span className="list-assignee">{displayName(task.assignee) || task.assignee.email}</span>
                    : <span className="list-empty-cell">—</span>
                  }
                </td>

                <td className="list-td list-td--due">
                  {task.due_date
                    ? <span className="list-due">{dayjs(task.due_date).format('MMM D')}</span>
                    : <span className="list-empty-cell">—</span>
                  }
                </td>

                <td className="list-td">
                  {task.labels?.length > 0 ? (
                    <div className="task-labels">
                      {task.labels.slice(0, 2).map(id => {
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
                      {task.labels.length > 2 && (
                        <span className="label-chip label-chip--sm label-chip--overflow">
                          +{task.labels.length - 2}
                        </span>
                      )}
                    </div>
                  ) : <span className="list-empty-cell">—</span>}
                </td>

                <td className="list-td list-td--action" onClick={e => e.stopPropagation()}>
                  <div className="list-row-actions">
                    {canEdit && onComplete && task.status !== 'done' && !isLockedByOther && (
                      <button
                        className="task-complete-btn"
                        style={{ opacity: 1, position: 'static' }}
                        aria-label="Mark as done"
                        title="Mark as done"
                        onClick={() => onComplete(task.id)}
                      >
                        <Check size={16} weight="bold" aria-hidden="true" />
                      </button>
                    )}
                    {canDelete && !isLockedByOther && (
                      <button
                        className="task-delete"
                        style={{ opacity: 1, position: 'static' }}
                        aria-label="Delete task"
                        onClick={() => onDelete(task.id)}
                      >
                        <X size={16} weight="bold" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
