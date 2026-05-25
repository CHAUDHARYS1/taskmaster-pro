import { useRef, useState } from 'react'
import { useToast } from '../../contexts/ToastContext'

export default function BugReportSheet({ onClose }) {
  const { toast } = useToast()
  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [steps, setSteps]       = useState('')
  const [severity, setSeverity] = useState('Bug')
  const [submitting, setSubmitting] = useState(false)
  const titleRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { titleRef.current?.focus(); return }
    if (!desc.trim())  return

    setSubmitting(true)
    try {
      const resp = await fetch('/.netlify/functions/create-github-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), severity, description: desc.trim(), steps: steps.trim() }),
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data.error || 'Unknown error')
      toast.success('Report submitted — thank you!')
      onClose()
    } catch (err) {
      toast.error(err.message || 'Could not submit. Try again later.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{ alignItems: 'flex-end' }}
      onClick={onClose}
    >
      <div
        className="bug-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Report a bug"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Report / Request a Feature</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="field-block">
            <label htmlFor="bug-severity">Type</label>
            <select
              id="bug-severity"
              className="field-select"
              value={severity}
              onChange={e => setSeverity(e.target.value)}
            >
              <option value="Bug">Bug</option>
              <option value="UI Glitch">UI Glitch</option>
              <option value="Data Issue">Data Issue</option>
              <option value="Crash">Crash</option>
              <option value="Feature Request">Feature Request</option>
            </select>
          </div>

          <div className="field-block">
            <label htmlFor="bug-title">Title <span className="field-required">*</span></label>
            <input
              ref={titleRef}
              id="bug-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Short summary"
              required
              autoFocus
            />
          </div>

          <div className="field-block">
            <label htmlFor="bug-desc">Description <span className="field-required">*</span></label>
            <textarea
              id="bug-desc"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="What happened?"
              rows={4}
              required
            />
          </div>

          <div className="field-block">
            <label htmlFor="bug-steps">Steps to reproduce</label>
            <textarea
              id="bug-steps"
              value={steps}
              onChange={e => setSteps(e.target.value)}
              placeholder="Optional: step-by-step to trigger the issue"
              rows={3}
            />
          </div>

          <div className="modal-ftr">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !title.trim() || !desc.trim()}
            >
              {submitting ? 'Sending…' : 'Send Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
