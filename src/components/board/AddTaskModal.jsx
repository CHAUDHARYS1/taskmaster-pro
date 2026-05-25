import { useState } from 'react'

export default function AddTaskModal({ onClose, onSave }) {
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSave({ text: text.trim(), due_date: dueDate || null })
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
              <label htmlFor="task-desc">Task description</label>
              <textarea
                id="task-desc"
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            <div className="field-block">
              <label htmlFor="task-date">Due date</label>
              <input
                id="task-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}
          </div>

          <div className="modal-ftr">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !text.trim()}>
              {loading ? 'Saving…' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
