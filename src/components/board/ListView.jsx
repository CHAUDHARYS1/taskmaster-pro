import { useState, useRef, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { Check, X, ArrowSquareOut, CaretDown, CaretUp } from '@phosphor-icons/react'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { PRIORITIES, priorityMap } from '../../lib/priority'
import { userColor } from '../../lib/userColor'

const DEFAULT_COLS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

const STATUS_DOT = {
  toDo:       '#94a3b8',
  inProgress: '#f59e0b',
  inReview:   '#3b82f6',
  done:       '#22c55e',
}

function urgencyKind(due_date, colId) {
  if (!due_date || colId === 'done') return null
  const diff = dayjs(due_date).diff(dayjs(), 'day')
  if (diff < 0)  return 'overdue'
  if (diff <= 1) return 'soon'
  return null
}

function displayName(u) {
  if (!u) return null
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ')
  return full || u.email?.split('@')[0] || null
}

// Floating cell menu — closes on outside click
function CellMenu({ children, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    let id
    const handler = e => { if (!ref.current?.contains(e.target)) onClose() }
    id = setTimeout(() => document.addEventListener('mousedown', handler), 0)
    return () => { clearTimeout(id); document.removeEventListener('mousedown', handler) }
  }, [onClose])
  return <div className="lv-menu" ref={ref}>{children}</div>
}

const PRIORITY_OPTIONS = [
  { id: null,     name: 'No priority', icon: '—', color: 'var(--ink-4)' },
  ...PRIORITIES,
]

export default function ListView({
  columns    = DEFAULT_COLS,
  tasksByStatus,
  canEdit,
  canDelete,
  onDelete,
  onOpen,
  onComplete,
  onUpdate,
  editingMap,
  showProject,
  members    = [],
}) {
  const { labelMap }              = useLabelsCtx()
  const [editing, setEditing]     = useState(null)   // { id, field }
  const [editVal, setEditVal]     = useState('')
  const [openMenu, setOpenMenu]   = useState(null)   // { id, field }
  const [sort, setSort]           = useState({ col: null, dir: 'asc' })

  const allTasks = columns.flatMap(col =>
    (tasksByStatus[col.id] ?? []).map(t => ({ ...t, _colId: col.id, _colLabel: col.label }))
  )

  const toggleSort = col => {
    setSort(s => {
      if (s.col !== col) return { col, dir: 'asc' }
      if (s.dir === 'asc') return { col, dir: 'desc' }
      return { col: null, dir: 'asc' }
    })
  }

  const PRIO_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1 }

  const sortedTasks = useMemo(() => {
    if (!sort.col) return allTasks
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...allTasks].sort((a, b) => {
      switch (sort.col) {
        case 'status': {
          const ai = columns.findIndex(c => c.id === a._colId)
          const bi = columns.findIndex(c => c.id === b._colId)
          return (ai - bi) * dir
        }
        case 'priority': {
          const aw = PRIO_WEIGHT[a.priority] ?? 0
          const bw = PRIO_WEIGHT[b.priority] ?? 0
          if (aw === 0 && bw !== 0) return 1
          if (bw === 0 && aw !== 0) return -1
          if (aw === bw) return 0
          return (aw - bw) * dir
        }
        case 'assignee': {
          const an = displayName(a.assignee) ?? ''
          const bn = displayName(b.assignee) ?? ''
          if (!an && bn) return 1
          if (!bn && an) return -1
          return an.localeCompare(bn) * dir
        }
        case 'due': {
          const at = a.due_date ? dayjs(a.due_date).valueOf() : null
          const bt = b.due_date ? dayjs(b.due_date).valueOf() : null
          if (at === null && bt !== null) return 1
          if (bt === null && at !== null) return -1
          if (at === bt) return 0
          return (at - bt) * dir
        }
        default: return 0
      }
    })
  // allTasks identity changes each render; sort.col/dir are the real deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTasks, sort.col, sort.dir])

  const startEdit = (id, field, val) => {
    if (!canEdit) return
    setEditing({ id, field })
    setEditVal(val ?? '')
    setOpenMenu(null)
  }

  const commitEdit = async (id, field) => {
    if (!onUpdate) { setEditing(null); return }
    const task = allTasks.find(t => t.id === id)
    if (!task)   { setEditing(null); return }
    const next = editVal.trim()
    const prev = String((field === 'title' ? task.text : task[field]) ?? '')
    if (next !== prev) {
      if (field === 'title' && !next) { setEditing(null); return }
      await onUpdate(id, field === 'title' ? { text: next } : { [field]: next || null })
    }
    setEditing(null)
  }

  const handleKey = (e, id, field) => {
    if (e.key === 'Enter')  { e.preventDefault(); commitEdit(id, field) }
    if (e.key === 'Escape') setEditing(null)
  }

  const toggleMenu = (id, field) => {
    if (!canEdit) return
    setOpenMenu(m => m?.id === id && m?.field === field ? null : { id, field })
    setEditing(null)
  }

  if (allTasks.length === 0) return (
    <div className="lv-empty-state">
      <span className="lv-empty-icon">◻</span>
      <span>No tasks yet</span>
    </div>
  )

  return (
    <div className="lv-root">
      <table className="lv-table">
        <thead className="lv-thead">
          <tr>
            <th className="lv-th lv-th-num">#</th>
            <th className="lv-th lv-th-title">Task</th>
            {showProject && <th className="lv-th lv-th-project">Project</th>}
            <th
              className={['lv-th lv-th-status lv-th-sortable', sort.col === 'status' ? 'lv-th-active' : ''].filter(Boolean).join(' ')}
              onClick={() => toggleSort('status')}
            >
              Status
              {sort.col === 'status' && (sort.dir === 'asc'
                ? <CaretUp className="lv-sort-icon" size={9} aria-hidden="true" />
                : <CaretDown className="lv-sort-icon" size={9} aria-hidden="true" />
              )}
            </th>
            <th
              className={['lv-th lv-th-priority lv-th-sortable', sort.col === 'priority' ? 'lv-th-active' : ''].filter(Boolean).join(' ')}
              onClick={() => toggleSort('priority')}
            >
              Priority
              {sort.col === 'priority' && (sort.dir === 'asc'
                ? <CaretUp className="lv-sort-icon" size={9} aria-hidden="true" />
                : <CaretDown className="lv-sort-icon" size={9} aria-hidden="true" />
              )}
            </th>
            <th
              className={['lv-th lv-th-assignee lv-th-sortable', sort.col === 'assignee' ? 'lv-th-active' : ''].filter(Boolean).join(' ')}
              onClick={() => toggleSort('assignee')}
            >
              Assignee
              {sort.col === 'assignee' && (sort.dir === 'asc'
                ? <CaretUp className="lv-sort-icon" size={9} aria-hidden="true" />
                : <CaretDown className="lv-sort-icon" size={9} aria-hidden="true" />
              )}
            </th>
            <th
              className={['lv-th lv-th-due lv-th-sortable', sort.col === 'due' ? 'lv-th-active' : ''].filter(Boolean).join(' ')}
              onClick={() => toggleSort('due')}
            >
              Due
              {sort.col === 'due' && (sort.dir === 'asc'
                ? <CaretUp className="lv-sort-icon" size={9} aria-hidden="true" />
                : <CaretDown className="lv-sort-icon" size={9} aria-hidden="true" />
              )}
            </th>
            <th className="lv-th lv-th-labels">Labels</th>
            <th className="lv-th lv-th-actions" aria-hidden="true" />
          </tr>
        </thead>

        <tbody>
          {sortedTasks.map((task, idx) => {
            const p           = task.priority ? priorityMap[task.priority] : null
            const eu          = editingMap?.[task.id]
            const lockedOther = eu && !eu.is_self
            const selfEdit    = eu?.is_self === true
            const glowColor   = selfEdit ? 'var(--accent)' : eu ? userColor(eu.user_id) : null
            const urgency     = urgencyKind(task.due_date, task._colId)
            const isDone      = task._colId === 'done'

            const editTitle    = editing?.id === task.id && editing?.field === 'title'
            const editDue      = editing?.id === task.id && editing?.field === 'due_date'
            const menuStatus   = openMenu?.id === task.id && openMenu?.field === 'status'
            const menuPriority = openMenu?.id === task.id && openMenu?.field === 'priority'
            const menuAssignee = openMenu?.id === task.id && openMenu?.field === 'assignee'

            return (
              <tr
                key={task.id}
                className={[
                  'lv-row',
                  idx % 2 === 1         ? 'lv-row-alt'     : '',
                  isDone                ? 'lv-row-done'    : '',
                  urgency === 'overdue' ? 'lv-row-overdue' : '',
                  urgency === 'soon'    ? 'lv-row-soon'    : '',
                  lockedOther           ? 'lv-row-locked'  : '',
                  selfEdit              ? 'lv-row-self'    : '',
                ].filter(Boolean).join(' ')}
                style={glowColor ? { '--ec': glowColor } : undefined}
              >
                {/* ── Row number / check (CSS hover, no React state) ── */}
                <td className="lv-td lv-td-num">
                  <span className="lv-row-num">{idx + 1}</span>
                  {canEdit && onComplete && !isDone && !lockedOther && (
                    <button
                      className="lv-check"
                      onClick={() => onComplete(task.id)}
                      aria-label="Mark as done"
                      title="Mark as done"
                    >
                      <Check size={11} weight="bold" />
                    </button>
                  )}
                </td>

                {/* ── Title ── */}
                <td
                  className={[
                    'lv-td lv-td-title',
                    canEdit && !lockedOther ? 'lv-td-editable' : '',
                    editTitle             ? 'lv-td-active'   : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !lockedOther && startEdit(task.id, 'title', task.text)}
                >
                  {lockedOther && (
                    <span
                      className="lv-presence"
                      style={{ background: glowColor }}
                      title={eu.display_name || eu.email}
                    />
                  )}
                  {editTitle ? (
                    <input
                      className="lv-cell-input"
                      value={editVal}
                      autoFocus
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(task.id, 'title')}
                      onKeyDown={e => handleKey(e, task.id, 'title')}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span className={['lv-task-name', isDone ? 'lv-task-name-done' : ''].filter(Boolean).join(' ')}>
                      {task.text}
                    </span>
                  )}
                </td>

                {/* ── Project ── */}
                {showProject && (
                  <td className="lv-td">
                    {task.project
                      ? <span className="lv-project"><span className="lv-project-dot" style={{ background: task.project.color }} />{task.project.name}</span>
                      : <span className="lv-nil">—</span>}
                  </td>
                )}

                {/* ── Status ── */}
                <td
                  className={[
                    'lv-td lv-td-select',
                    canEdit && !lockedOther ? 'lv-td-editable' : '',
                    menuStatus            ? 'lv-td-active'   : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !lockedOther && toggleMenu(task.id, 'status')}
                >
                  <span className="lv-status-cell">
                    <span className="lv-dot" style={{ background: STATUS_DOT[task._colId] ?? STATUS_DOT.toDo }} />
                    <span>{task._colLabel}</span>
                    {canEdit && !lockedOther && <CaretDown className="lv-caret" size={10} aria-hidden="true" />}
                  </span>
                  {menuStatus && (
                    <CellMenu onClose={() => setOpenMenu(null)}>
                      {columns.map(col => (
                        <button
                          key={col.id}
                          className="lv-menu-item"
                          onClick={async () => { await onUpdate?.(task.id, { status: col.id }); setOpenMenu(null) }}
                        >
                          <span className="lv-dot" style={{ background: STATUS_DOT[col.id] }} />
                          {col.label}
                        </button>
                      ))}
                    </CellMenu>
                  )}
                </td>

                {/* ── Priority ── */}
                <td
                  className={[
                    'lv-td lv-td-select',
                    canEdit && !lockedOther ? 'lv-td-editable' : '',
                    menuPriority          ? 'lv-td-active'   : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !lockedOther && toggleMenu(task.id, 'priority')}
                >
                  {p ? (
                    <span className="lv-priority" style={{ color: p.color }}>
                      <span className="lv-p-icon">{p.icon}</span>{p.name}
                    </span>
                  ) : (
                    <span className="lv-nil lv-nil-hint">{canEdit ? 'None' : '—'}</span>
                  )}
                  {menuPriority && (
                    <CellMenu onClose={() => setOpenMenu(null)}>
                      {PRIORITY_OPTIONS.map(opt => (
                        <button
                          key={opt.id ?? 'none'}
                          className="lv-menu-item"
                          style={{ color: opt.color }}
                          onClick={async () => { await onUpdate?.(task.id, { priority: opt.id }); setOpenMenu(null) }}
                        >
                          <span className="lv-p-icon">{opt.icon}</span>{opt.name}
                        </button>
                      ))}
                    </CellMenu>
                  )}
                </td>

                {/* ── Assignee ── */}
                <td
                  className={[
                    'lv-td lv-td-select',
                    canEdit && members.length > 0 && !lockedOther ? 'lv-td-editable' : '',
                    menuAssignee ? 'lv-td-active' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !lockedOther && canEdit && members.length > 0 && toggleMenu(task.id, 'assignee')}
                >
                  {task.assignee ? (
                    <span className="lv-assignee">
                      <span className="lv-avatar" style={{ '--av': userColor(task.assignee.user_id ?? task.assignee.id) }}>
                        {(displayName(task.assignee) || task.assignee.email || '?')[0].toUpperCase()}
                      </span>
                      <span className="lv-assignee-name">{displayName(task.assignee) || task.assignee.email}</span>
                    </span>
                  ) : (
                    <span className="lv-nil lv-nil-hint">{canEdit && members.length > 0 ? 'Assign…' : '—'}</span>
                  )}
                  {menuAssignee && (
                    <CellMenu onClose={() => setOpenMenu(null)}>
                      {task.assignee && (
                        <button
                          className="lv-menu-item lv-menu-item-muted"
                          onClick={async () => { await onUpdate?.(task.id, { assignee_id: null, assignee: null }); setOpenMenu(null) }}
                        >
                          Unassign
                        </button>
                      )}
                      {members.map(m => (
                        <button
                          key={m.user_id}
                          className="lv-menu-item"
                          onClick={async () => { await onUpdate?.(task.id, { assignee_id: m.user_id, assignee: m }); setOpenMenu(null) }}
                        >
                          <span className="lv-avatar lv-avatar-sm" style={{ '--av': userColor(m.user_id) }}>
                            {(displayName(m) || m.email || '?')[0].toUpperCase()}
                          </span>
                          {displayName(m) || m.email}
                        </button>
                      ))}
                    </CellMenu>
                  )}
                </td>

                {/* ── Due date ── */}
                <td
                  className={[
                    'lv-td lv-td-due',
                    canEdit && !lockedOther ? 'lv-td-editable' : '',
                    editDue               ? 'lv-td-active'   : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => !lockedOther && canEdit && startEdit(task.id, 'due_date', task.due_date ?? '')}
                >
                  {editDue ? (
                    <input
                      className="lv-date-input"
                      type="date"
                      value={editVal}
                      autoFocus
                      onChange={e => setEditVal(e.target.value)}
                      onBlur={() => commitEdit(task.id, 'due_date')}
                      onKeyDown={e => handleKey(e, task.id, 'due_date')}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : task.due_date ? (
                    <span className={[
                      'lv-due',
                      urgency === 'overdue' ? 'lv-due-overdue' : '',
                      urgency === 'soon'    ? 'lv-due-soon'    : '',
                    ].filter(Boolean).join(' ')}>
                      {dayjs(task.due_date).format('MMM D')}
                    </span>
                  ) : (
                    <span className="lv-nil lv-nil-hint">{canEdit ? 'Set date…' : '—'}</span>
                  )}
                </td>

                {/* ── Labels ── */}
                <td className="lv-td lv-td-labels">
                  {task.labels?.length > 0 ? (
                    <div className="lv-chips">
                      {task.labels.slice(0, 2).map(id => {
                        const label = labelMap[id]
                        if (!label) return null
                        const [r, g, b] = [1, 3, 5].map(i => parseInt(label.color.slice(i, i + 2), 16))
                        return (
                          <span
                            key={id}
                            className="lv-chip"
                            style={{ '--lc': label.color, '--lb': `rgba(${r},${g},${b},.13)` }}
                          >
                            {label.name}
                          </span>
                        )
                      })}
                      {task.labels.length > 2 && (
                        <span className="lv-chip-overflow">+{task.labels.length - 2}</span>
                      )}
                    </div>
                  ) : <span className="lv-nil">—</span>}
                </td>

                {/* ── Actions ── */}
                <td className="lv-td lv-td-actions" onClick={e => e.stopPropagation()}>
                  <div className="lv-actions">
                    {onOpen && (
                      <button className="lv-act" title="Open details" aria-label="Open details" onClick={() => onOpen(task.id)}>
                        <ArrowSquareOut size={13} />
                      </button>
                    )}
                    {canDelete && !lockedOther && onDelete && (
                      <button className="lv-act lv-act-del" title="Delete" aria-label="Delete task" onClick={() => onDelete(task.id)}>
                        <X size={13} weight="bold" />
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
