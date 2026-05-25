import { useState } from 'react'
import dayjs from 'dayjs'

const DEFAULT_COLS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function AddTaskModal({ columns = DEFAULT_COLS, onClose, onSave }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const [title,   setTitle]   = useState('')
  const [desc,    setDesc]    = useState('')
  const [dueDate, setDueDate] = useState(today)
  const [status,  setStatus]  = useState(columns[0]?.id ?? 'toDo')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const text = title.trim() || desc.trim().split('\n')[0].slice(0, 80) || 'Untitled'
      await onSave({ text, description: desc.trim() || null, due_date: dueDate || null, status })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Add new task">
        <div className="modal-hdr">
          <h2 className="modal-ttl">Add New Task</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
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
                placeholder="Task title…"
                autoFocus
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

              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="task-date">Due date</label>
                <input
                  id="task-date"
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="quick-date-input"
                />
              </div>
            </div>

            <div className="quick-date-row">
              <button type="button" className={`quick-date-btn${dueDate === today    ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(today)}>Today</button>
              <button type="button" className={`quick-date-btn${dueDate === tomorrow ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(tomorrow)}>Tomorrow</button>
              <button type="button" className={`quick-date-btn${dueDate === nextWeek ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(nextWeek)}>Next week</button>
              <button type="button" className={`quick-date-btn${!dueDate            ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate('')}>None</button>
            </div>

            {error && <p className="form-error">{error}</p>}
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
