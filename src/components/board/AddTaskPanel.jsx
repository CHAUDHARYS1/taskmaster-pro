import { useEffect, useRef, useState } from 'react'
import { X, CheckSquare } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { isDesktop } from '../../utils/device'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { useAuth } from '../../contexts/AuthContext'
import { PRIORITIES } from '../../lib/priority'
import { supabase } from '../../lib/supabase'
import { usePanelResize } from '../../hooks/usePanelResize'

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

export default function AddTaskPanel({ columns = DEFAULT_COLS, onClose, onSave }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const { currentWorkspace, workspaceTemplate } = useWorkspace()
  const { labels } = useLabelsCtx()
  const { user } = useAuth()
  const { width, startResize } = usePanelResize()

  const [title,            setTitle]            = useState('')
  const [desc,             setDesc]             = useState('')
  const [dueDate,          setDueDate]          = useState('')
  const timeRef                                 = useRef(null)
  const [status,           setStatus]           = useState(columns[0]?.id ?? 'toDo')
  const [priority,         setPriority]         = useState(null)
  const [assigneeId,       setAssigneeId]       = useState('')
  const [selectedLabels,   setSelectedLabels]   = useState([])
  const [members,          setMembers]          = useState([])
  const [membersLoaded,    setMembersLoaded]    = useState(false)
  const [loading,          setLoading]          = useState(false)
  const [error,            setError]            = useState('')
  const [checklistItems,   setChecklistItems]   = useState([])
  const [newChecklistText, setNewChecklistText] = useState('')
  const [showChecklist,    setShowChecklist]    = useState(false)
  const [showCustomDate,   setShowCustomDate]   = useState(false)
  const [closing,          setClosing]          = useState(false)

  const titleRef  = useRef(null)
  const descRef   = useRef(null)
  const formRef   = useRef(null)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 220)
  }

  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [title])

  useEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [desc])

  useEffect(() => {
    if (!currentWorkspace?.id) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email, first_name, last_name')
      .eq('workspace_id', currentWorkspace.id)
      .then(({ data }) => { if (data) setMembers(data); setMembersLoaded(true) })
  }, [currentWorkspace?.id])

  const toggleLabel = (id) =>
    setSelectedLabels(prev => prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id])

  const addChecklistItem = () => {
    const trimmed = newChecklistText.trim()
    if (!trimmed) return
    setChecklistItems(prev => [...prev, { localId: Date.now(), text: trimmed }])
    setNewChecklistText('')
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
      handleClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const setQuickDate = (val) => {
    setDueDate(val)
    setShowCustomDate(false)
  }

  const isCustomDate = dueDate && dueDate !== today && dueDate !== tomorrow && dueDate !== nextWeek

  return (
    <aside
      className={`task-panel${closing ? ' task-panel--closing' : ''}`}
      style={{ width: `${Math.min(width, window.innerWidth)}px` }}
      role="complementary"
      aria-label="New task"
    >
        <div className="task-panel-resize" onMouseDown={startResize} aria-hidden="true" title="Drag to resize" />

        {/* ── Header ──────────────────────────────────────── */}
        <div className="atp-hdr">
          <span className="atp-hdr__label">New Task</span>
          <div className="atp-hdr__actions">
            <span className="atp-kbd" aria-hidden="true">⌘↵</span>
            <button className="modal-close" onClick={handleClose} aria-label="Close panel">
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Form ────────────────────────────────────────── */}
        <form
          id="add-task-panel-form"
          ref={formRef}
          onSubmit={handleSubmit}
          onKeyDown={e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              formRef.current?.requestSubmit()
            }
          }}
          className="atp-body"
        >
          {/* Title */}
          <textarea
            ref={titleRef}
            className="atp-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={workspaceTemplate === 'job-tracker' ? 'e.g. Stripe — Product Designer' : 'What needs to be done?'}
            autoFocus={isDesktop()}
            rows={1}
            aria-label="Task title"
          />

          {/* Description */}
          <textarea
            ref={descRef}
            className="atp-desc"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Add a description…"
            rows={2}
            aria-label="Description"
          />

          <div className="atp-divider" aria-hidden="true" />

          {/* ── Properties ──────────────────────────────── */}
          <div className="atp-props" role="group" aria-label="Task properties">

            {/* Column */}
            <div className="atp-prop">
              <label className="atp-prop__label" htmlFor="atp-status">Column</label>
              <div className="atp-prop__val">
                <select
                  id="atp-status"
                  className="atp-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>

            {/* Priority */}
            <div className="atp-prop atp-prop--wrap">
              <span className="atp-prop__label" id="atp-priority-label">Priority</span>
              <div className="atp-prop__val" role="group" aria-labelledby="atp-priority-label">
                <div className="atp-pill-row">
                  {PRIORITIES.map(p => {
                    const active = priority === p.id
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`atp-pill${active ? ' atp-pill--active' : ''}`}
                        style={{ '--p-color': p.color, '--p-bg': p.bg }}
                        onClick={() => setPriority(active ? null : p.id)}
                        aria-pressed={active}
                        title={active ? `Clear ${p.name}` : p.name}
                      >
                        <span aria-hidden="true">{p.icon}</span>
                        {p.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Due date */}
            <div className="atp-prop atp-prop--wrap">
              <span className="atp-prop__label" id="atp-due-label">Due date</span>
              <div className="atp-prop__val" role="group" aria-labelledby="atp-due-label">
                <div className="atp-pill-row">
                  <button type="button" className={`atp-pill${dueDate === today    ? ' atp-pill--active' : ''}`} onClick={() => setQuickDate(today)}    aria-pressed={dueDate === today}>Today</button>
                  <button type="button" className={`atp-pill${dueDate === tomorrow ? ' atp-pill--active' : ''}`} onClick={() => setQuickDate(tomorrow)} aria-pressed={dueDate === tomorrow}>Tomorrow</button>
                  <button type="button" className={`atp-pill${dueDate === nextWeek ? ' atp-pill--active' : ''}`} onClick={() => setQuickDate(nextWeek)} aria-pressed={dueDate === nextWeek}>Next week</button>
                  <button type="button" className={`atp-pill${!dueDate && !showCustomDate ? ' atp-pill--active' : ''}`} onClick={() => setQuickDate('')} aria-pressed={!dueDate && !showCustomDate}>None</button>
                  <button
                    type="button"
                    className={`atp-pill${showCustomDate || isCustomDate ? ' atp-pill--active' : ''}`}
                    onClick={() => { setShowCustomDate(s => !s); if (!dueDate) setDueDate(today) }}
                    aria-pressed={showCustomDate || isCustomDate}
                  >
                    {isCustomDate ? dayjs(dueDate).format('MMM D') : 'Custom…'}
                  </button>
                </div>
                {(showCustomDate || isCustomDate) && (
                  <div className="atp-date-row">
                    <input
                      type="date"
                      className="due-date-input"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      aria-label="Custom due date"
                    />
                    <input
                      ref={timeRef}
                      type="time"
                      className="due-time-input"
                      defaultValue=""
                      disabled={!dueDate}
                      aria-label="Due time"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Assignee */}
            {workspaceTemplate !== 'job-tracker' && (!membersLoaded || members.length > 1) && (
              <div className="atp-prop">
                <label className="atp-prop__label" htmlFor="atp-assignee">Assignee</label>
                <div className="atp-prop__val">
                  <select
                    id="atp-assignee"
                    className="atp-select"
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{memberDisplayName(m)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Labels */}
            {labels.length > 0 && (
              <div className="atp-prop atp-prop--wrap">
                <span className="atp-prop__label" id="atp-labels-label">Labels</span>
                <div className="atp-prop__val" role="group" aria-labelledby="atp-labels-label">
                  <div className="atp-pill-row">
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
              </div>
            )}
          </div>

          {/* ── Checklist (expandable) ────────────────────── */}
          {!showChecklist ? (
            <button
              type="button"
              className="atp-checklist-toggle"
              onClick={() => setShowChecklist(true)}
            >
              <CheckSquare size={14} aria-hidden="true" />
              Add checklist
            </button>
          ) : (
            <div className="atp-checklist">
              <div className="atp-checklist__hdr">
                <CheckSquare size={14} className="atp-checklist__icon" aria-hidden="true" />
                <span className="atp-prop__label">Checklist</span>
                {checklistItems.length > 0 && (
                  <span className="task-panel-count">{checklistItems.length}</span>
                )}
                <button
                  type="button"
                  className="atp-checklist__close"
                  onClick={() => { setShowChecklist(false); setChecklistItems([]) }}
                  aria-label="Remove checklist"
                >
                  <X size={12} weight="bold" aria-hidden="true" />
                </button>
              </div>

              {checklistItems.length > 0 && (
                <ul className="checklist-list checklist-list--create">
                  {checklistItems.map(item => (
                    <li key={item.localId} className="checklist-item">
                      <span className="checklist-item__text">{item.text}</span>
                      <button
                        type="button"
                        className="checklist-item__delete"
                        onClick={() => setChecklistItems(prev => prev.filter(i => i.localId !== item.localId))}
                        aria-label={`Remove "${item.text}"`}
                      >
                        <X size={12} weight="bold" aria-hidden="true" />
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
                  placeholder="Add an item…"
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
          )}

          {error && <p className="form-error" role="alert">{error}</p>}
        </form>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="task-panel-ftr">
          <span className="atp-ftr-hint" aria-hidden="true">⌘↵ to save</span>
          <button type="button" className="btn-ghost" onClick={handleClose}>Cancel</button>
          <button
            type="submit"
            form="add-task-panel-form"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Create Task'}
          </button>
        </div>
      </aside>
  )
}
