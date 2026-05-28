import { useEffect, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { supabase } from '../../lib/supabase'

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

export default function DashboardQuickAdd({ onSaved }) {
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
  const [saved,       setSaved]       = useState(false)

  const [projects, setProjects] = useState([])

  useEffect(() => {
    setProjectId('')
    if (!workspaceId) { setProjects([]); return }
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .then(({ data }) => { if (data) setProjects(data) })
  }, [workspaceId])

  const reset = () => {
    setTitle('')
    setStatus('toDo')
    setDueDate(today)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workspaceId) { setError('Select a workspace.'); return }
    if (!projectId)   { setError('Select a project.'); return }
    if (!title.trim()) { setError('Enter a task title.'); return }

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
        text:         title.trim(),
        status,
        due_date:     dueDate || null,
        position:     maxPos + 1000,
      })
      if (insertError) throw insertError

      reset()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dash-quick-add">
      <h2 className="dash-quick-add-title">Add Task</h2>

      <form onSubmit={handleSubmit} className="dash-quick-add-form">

        <div className="field-block">
          <label htmlFor="qa-workspace">Workspace</label>
          <select
            id="qa-workspace"
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

        <div className="field-block">
          <label htmlFor="qa-project">
            Project <span className="field-required">*</span>
          </label>
          <select
            id="qa-project"
            className="field-select"
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            disabled={!workspaceId || projects.length === 0}
          >
            <option value="">
              {!workspaceId
                ? 'Select a workspace first'
                : projects.length === 0
                  ? 'No projects'
                  : 'Select project…'}
            </option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="field-block">
          <label htmlFor="qa-title">
            Title <span className="field-required">*</span>
          </label>
          <input
            id="qa-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>

        <div className="field-block">
          <label htmlFor="qa-status">Column</label>
          <select
            id="qa-status"
            className="field-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {COLUMNS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="field-block">
          <label htmlFor="qa-due">Due date</label>
          <input
            id="qa-due"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="quick-date-input"
          />
          <div className="quick-date-row">
            <button type="button" className={`quick-date-btn${dueDate === today    ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(today)}>Today</button>
            <button type="button" className={`quick-date-btn${dueDate === tomorrow ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(tomorrow)}>Tomorrow</button>
            <button type="button" className={`quick-date-btn${dueDate === nextWeek ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate(nextWeek)}>Next week</button>
            <button type="button" className={`quick-date-btn${!dueDate            ? ' quick-date-btn--active' : ''}`} onClick={() => setDueDate('')}>None</button>
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}

        {saved && (
          <p className="dash-quick-add-success">
            <CheckCircle size={16} weight="fill" aria-hidden="true" />
            Task added!
          </p>
        )}

        <button type="submit" className="btn-primary btn-block" disabled={loading}>
          {loading ? 'Saving…' : 'Add Task'}
        </button>

      </form>
    </div>
  )
}
