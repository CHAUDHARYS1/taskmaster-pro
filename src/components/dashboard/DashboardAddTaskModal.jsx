import { useEffect, useState } from 'react'
import { X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useProjects } from '../../hooks/useProjects'
import { supabase } from '../../lib/supabase'

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function DashboardAddTaskModal({ onClose, onSaved }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const { workspaces, currentWorkspace } = useWorkspace()

  const [workspaceId, setWorkspaceId] = useState(currentWorkspace?.id ?? '')
  const [projectId,   setProjectId]   = useState('')
  const [title,       setTitle]       = useState('')
  const [status,      setStatus]      = useState('toDo')
  const [dueDate,     setDueDate]     = useState(today)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const { projects } = useProjects(workspaceId)

  useEffect(() => { setProjectId('') }, [workspaceId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workspaceId) { setError('Please select a workspace.'); return }
    if (!projectId)   { setError('Please select a project.'); return }

    setLoading(true)
    setError('')
    try {
      const { data: existing } = await supabase
        .from('tasks')
        .select('position')
        .eq('workspace_id', workspaceId)
        .eq('project_id', projectId)
        .eq('status', status)
        .order('position', { ascending: false })
        .limit(1)

      const maxPos = existing?.[0]?.position ?? 0

      const { error: insertError } = await supabase.from('tasks').insert({
        workspace_id: workspaceId,
        project_id:   projectId,
        text:         title.trim() || 'Untitled',
        status,
        due_date:     dueDate || null,
        position:     maxPos + 1000,
      })
      if (insertError) throw insertError

      onSaved?.()
      onClose()
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
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            <div className="add-task-row">
              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="dash-workspace">
                  Workspace <span className="field-required">*</span>
                </label>
                <select
                  id="dash-workspace"
                  className="field-select"
                  value={workspaceId}
                  onChange={e => setWorkspaceId(e.target.value)}
                >
                  <option value="">Select workspace…</option>
                  {workspaces.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="dash-project">
                  Project <span className="field-required">*</span>
                </label>
                <select
                  id="dash-project"
                  className="field-select"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  disabled={!workspaceId || projects.length === 0}
                >
                  <option value="">
                    {!workspaceId
                      ? 'Select a workspace first'
                      : projects.length === 0
                        ? 'No projects found'
                        : 'Select project…'}
                  </option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field-block">
              <label htmlFor="dash-task-title">Title</label>
              <input
                id="dash-task-title"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Task title…"
                autoFocus
              />
            </div>

            <div className="add-task-row">
              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="dash-task-status">Column</label>
                <select
                  id="dash-task-status"
                  className="field-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {COLUMNS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="field-block" style={{ flex: 1 }}>
                <label htmlFor="dash-task-date">Due date</label>
                <input
                  id="dash-task-date"
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
