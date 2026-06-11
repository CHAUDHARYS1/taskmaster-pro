import { useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { isDesktop } from '../../utils/device'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { useAuth } from '../../contexts/AuthContext'
import { PRIORITIES } from '../../lib/priority'
import { supabase } from '../../lib/supabase'

const DEFAULT_COLS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}

export default function AddTaskModal({ columns = DEFAULT_COLS, onClose, onSave }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const { currentWorkspace, workspaceTemplate } = useWorkspace()
  const { labels } = useLabelsCtx()
  const { user } = useAuth()

  const [title,       setTitle]       = useState('')
  const [desc,        setDesc]        = useState('')
  const [dueDate,     setDueDate]     = useState(today)
  const timeRef = useRef(null)
  const [status,      setStatus]      = useState(columns[0]?.id ?? 'toDo')
  const [priority,    setPriority]    = useState(null)
  const [assigneeId,  setAssigneeId]  = useState('')
  const [selectedLabels, setSelectedLabels] = useState([])
  const [members,          setMembers]          = useState([])
  const [membersLoaded,    setMembersLoaded]    = useState(false)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [checklistItems,   setChecklistItems]   = useState([])
  const [newChecklistText, setNewChecklistText] = useState('')

  useEffect(() => {
    if (!currentWorkspace?.id) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email, first_name, last_name')
      .eq('workspace_id', currentWorkspace.id)
      .then(({ data }) => { if (data) setMembers(data); setMembersLoaded(true) })
  }, [currentWorkspace?.id])

  const sheetRef = useRef(null)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const focusable = Array.from(sheetRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const toggleLabel = (id) => {
    setSelectedLabels(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )
  }

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim()
    if (!trimmed) return
    setChecklistItems(prev => [...prev, { localId: Date.now(), text: trimmed }])
    setNewChecklistText('')
  }

  const removeChecklistItem = (localId) => {
    setChecklistItems(prev => prev.filter(i => i.localId !== localId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const text = title.trim() || desc.trim().split('\n')[0].slice(0, 80) || 'Untitled'
      const taskId = await onSave({
        text,
        description:  desc.trim() || null,
        due_date:     dueDate || null,
        due_time:     timeRef.current?.value || null,
        status,
        priority:     priority || null,
        assignee_id:  assigneeId || null,
        labels:       selectedLabels,
      })
      if (taskId && checklistItems.length > 0) {
        await supabase.from('task_checklist_items').insert(
          checklistItems.map((item, i) => ({
            task_id:    taskId,
            text:       item.text,
            checked:    false,
            position:   (i + 1) * 1000,
            created_by: user.id,
          }))
        )
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" ref={sheetRef} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add new task">
        <div className="modal-hdr">
          <h2 className="modal-ttl">Add New Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field-block">
              <label htmlFor="task-title">
                Title <span className="field-optional">(optional)</span>
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={workspaceTemplate === 'job-tracker' ? 'e.g. Stripe — Product Designer' : 'Task title…'}
                autoFocus={isDesktop()}
              />
            </div>

            <div className="field-block">
              <label htmlFor="task-desc">
                Description <span className="field-optional">(optional)</span>
              </label>
              <textarea
                id="task-desc"
                rows={3}
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Add more details…"
              />
            </div>

            <div className="field-block">
              <label>Checklist <span className="field-optional">(optional)</span></label>
              {checklistItems.length > 0 && (
                <ul className="checklist-list checklist-list--create">
                  {checklistItems.map(item => (
                    <li key={item.localId} className="checklist-item">
                      <span className="checklist-item__text">{item.text}</span>
                      <button
                        type="button"
                        className="checklist-item__delete"
                        onClick={() => removeChecklistItem(item.localId)}
                        aria-label="Remove item"
                      >
                        <X size={13} weight="bold" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="checklist-add-row">
                <input
                  type="text"
                  className="checklist-add-input"
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem() } }}
                  placeholder="Add a checklist item…"
                  aria-label="New checklist item"
                />
                <button
                  type="button"
                  className="btn-ghost checklist-add-btn"
                  onClick={addChecklistItem}
                  disabled={!newChecklistText.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            <div className="add-task-row">
              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="task-status">Column</label>
                <select
                  id="task-status"
                  className="field-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {columns.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {workspaceTemplate !== 'job-tracker' && (!membersLoaded || members.length > 1) && (
                <div className="field-block" style={{ flex: 1 }}>
                  <label htmlFor="task-assignee">Assignee</label>
                  <select
                    id="task-assignee"
                    className="field-select"
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{memberDisplayName(m)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="add-task-row">
              <div className="field-block" style={{ flex: 2 }}>
                <label htmlFor="task-date">Due date</label>
                <input
                  id="task-date"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="quick-date-input"
                />
              </div>
              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="task-time">Time <span className="field-optional">(optional)</span></label>
                <input
                  ref={timeRef}
                  id="task-time"
                  type="time"
                  defaultValue=""
                  className="due-time-input"
                  disabled={!dueDate}
                />
              </div>
            </div>

            <div className="quick-date-row">
              <button type="button" className={`quick-date-btn${dueDate === today    ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(today)}    aria-pressed={dueDate === today}>Today</button>
              <button type="button" className={`quick-date-btn${dueDate === tomorrow ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(tomorrow)} aria-pressed={dueDate === tomorrow}>Tomorrow</button>
              <button type="button" className={`quick-date-btn${dueDate === nextWeek ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(nextWeek)} aria-pressed={dueDate === nextWeek}>Next week</button>
              <button type="button" className={`quick-date-btn${!dueDate            ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate('')}        aria-pressed={!dueDate}>None</button>
            </div>

            <div className="field-block">
              <label>Priority</label>
              <div className="priority-picker">
                {PRIORITIES.map(p => {
                  const active = priority === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`priority-btn${active ? ' priority-btn--active' : ''}`}
                      style={{ '--p-color': p.color }}
                      onClick={() => setPriority(active ? null : p.id)}
                      aria-pressed={active}
                      title={active ? 'Click to clear' : undefined}
                    >
                      <span className="priority-icon">{p.icon}</span>
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {labels.length > 0 && (
              <div className="field-block">
                <label>Labels</label>
                <div className="label-picker">
                  {labels.map(label => {
                    const active = selectedLabels.includes(label.id)
                    const rgb = label.color.length === 7
                      ? `${parseInt(label.color.slice(1,3),16)},${parseInt(label.color.slice(3,5),16)},${parseInt(label.color.slice(5,7),16)}`
                      : '37,99,235'
                    return (
                      <button
                        key={label.id}
                        type="button"
                        className={`label-chip${active ? ' label-chip--active' : ''}`}
                        style={{ '--label-color': label.color, '--label-bg': `rgba(${rgb},0.12)` }}
                        onClick={() => toggleLabel(label.id)}
                        aria-pressed={active}
                      >
                        {label.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {error && <p className="form-error" id="add-task-error" role="alert">{error}</p>}
          </div>

          <div className="modal-ftr">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
