import dayjs from 'dayjs'
import { labelMap } from '../../lib/labels'
import { priorityMap } from '../../lib/priority'

const COLUMNS = [
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

export default function ListView({ tasksByStatus, canEdit, canDelete, onDelete, onOpen, editingMap }) {
  const allTasks = COLUMNS.flatMap(col =>
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
            <th className="list-th">Status</th>
            <th className="list-th">Priority</th>
            <th className="list-th">Assignee</th>
            <th className="list-th">Due</th>
            <th className="list-th">Labels</th>
            {canDelete && <th className="list-th list-th--action" />}
          </tr>
        </thead>
        <tbody>
          {allTasks.map(task => {
            const p   = task.priority ? priorityMap[task.priority] : null
            const editingUser = editingMap?.[task.id]
            const isLockedByOther = editingUser != null

            return (
              <tr
                key={task.id}
                className={[
                  'list-row',
                  urgencyClass(task.due_date),
                  isLockedByOther ? 'list-row--editing' : '',
                ].filter(Boolean).join(' ')}
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
                      title={`${editingUser.display_name || editingUser.email} is editing`}
                    >
                      {(editingUser.display_name || editingUser.email || '?')[0].toUpperCase()}
                    </span>
                  )}
                  <span className="list-task-text">{task.text}</span>
                  {task.description && (
                    <span className="list-task-desc">{task.description}</span>
                  )}
                </td>

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
                        return label ? (
                          <span
                            key={id}
                            className="label-chip label-chip--sm"
                            style={{ '--label-color': label.color, '--label-bg': label.bg }}
                          >
                            {label.name}
                          </span>
                        ) : null
                      })}
                      {task.labels.length > 2 && (
                        <span className="label-chip label-chip--sm label-chip--overflow">
                          +{task.labels.length - 2}
                        </span>
                      )}
                    </div>
                  ) : <span className="list-empty-cell">—</span>}
                </td>

                {canDelete && (
                  <td className="list-td list-td--action" onClick={e => e.stopPropagation()}>
                    <button
                      className="task-delete"
                      style={{ opacity: 1, position: 'static' }}
                      aria-label="Delete task"
                      onClick={() => onDelete(task.id)}
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
