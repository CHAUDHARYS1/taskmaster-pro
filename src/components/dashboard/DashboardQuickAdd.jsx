import { useEffect, useState } from 'react'
import { CheckCircle } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { PRIORITIES } from '../../lib/priority'
import { supabase } from '../../lib/supabase'

const COLUMNS = [
  { id: 'toDo',       label: 'To Do' },
  { id: 'inProgress', label: 'In Progress' },
  { id: 'inReview',   label: 'In Review' },
  { id: 'done',       label: 'Done' },
]

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.email?.split('@')[0] || m.email
}

export default function DashboardQuickAdd({ onSaved }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const { workspaces, currentWorkspace } = useWorkspace()
  const { labels } = useLabelsCtx()

  const [workspaceId,     setWorkspaceId]     = useState(currentWorkspace?.id ?? '')
  const [projectId,       setProjectId]       = useState('')
  const [title,           setTitle]           = useState('')
  const [desc,            setDesc]            = useState('')
  const [status,          setStatus]          = useState('toDo')
  const [priority,        setPriority]        = useState(null)
  const [assigneeId,      setAssigneeId]      = useState('')
  const [selectedLabels,  setSelectedLabels]  = useState([])
  const [dueDate,         setDueDate]         = useState(today)
  const [projects,        setProjects]        = useState([])
  const [members,         setMembers]         = useState([])
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [saved,           setSaved]           = useState(false)

  // Fetch projects for selected workspace (plain fetch — avoids realtime channel conflict)
  useEffect(() => {
    setProjectId('')
    setProjects([])
    if (!workspaceId) return
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .then(({ data }) => { if (data) setProjects(data) })
  }, [workspaceId])

  // Fetch members for selected workspace
  useEffect(() => {
    setAssigneeId('')
    setMembers([])
    if (!workspaceId) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email, first_name, last_name')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => { if (data) setMembers(data) })
  }, [workspaceId])

  const toggleLabel = (id) =>
    setSelectedLabels(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    )

  const reset = () => {
    setTitle('')
    setDesc('')
    setStatus('toDo')
    setPriority(null)
    setAssigneeId('')
    setSelectedLabels([])
    setDueDate(today)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!workspaceId)  { setError('Select a workspace.'); return }
    if (!projectId)    { setError('Select a project.'); return }
    if (!title.trim() && !desc.trim()) { setError('Enter a title or description.'); return }

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
      const text   = title.trim() || desc.trim().split('\n')[0].slice(0, 80) || 'Untitled'

      const { error: insertError } = await supabase.from('tasks').insert({
        workspace_id: workspaceId,
        project_id:   projectId,
        text,
        description:  desc.trim() || null,
        status,
        priority:     priority || null,
        assignee_id:  assigneeId || null,
        labels:       selectedLabels,
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
            Title <span className="field-optional">(optional)</span>
          </label>
          <input
            id="qa-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Task title…"
          />
        </div>

        <div className="field-block">
          <label htmlFor="qa-desc">
            Description <span className="field-optional">(optional)</span>
          </label>
          <textarea
            id="qa-desc"
            rows={3}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Add more details…"
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
          <label htmlFor="qa-assignee">Assignee</label>
          <select
            id="qa-assignee"
            className="field-select"
            value={assigneeId}
            onChange={e => setAssigneeId(e.target.value)}
            disabled={!workspaceId}
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>{memberDisplayName(m)}</option>
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
                  style={{ '--p-color': p.color, '--p-bg': p.bg }}
                  onClick={() => setPriority(active ? null : p.id)}
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
                  >
                    {label.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

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
