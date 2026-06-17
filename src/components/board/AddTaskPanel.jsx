import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { isDesktop } from '../../utils/device'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { useAuth } from '../../contexts/AuthContext'
import { PRIORITIES } from '../../lib/priority'
import { supabase } from '../../lib/supabase'
import TiptapEditor from '../ui/TiptapEditor'

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

export default function AddTaskPanel({ columns = DEFAULT_COLS, onClose, onSave, initialDate = '' }) {
  const today    = dayjs().format('YYYY-MM-DD')
  const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const nextWeek = dayjs().add(7, 'day').format('YYYY-MM-DD')

  const { currentWorkspace, workspaceTemplate } = useWorkspace()
  const { labels } = useLabelsCtx()
  const { user } = useAuth()

  const [title,            setTitle]            = useState('')
  const [desc,             setDesc]             = useState('')
  const [startDate,        setStartDate]        = useState('')
  const [dueDate,          setDueDate]          = useState(initialDate)
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
  const [confirmDiscard,   setConfirmDiscard]   = useState(false)

  const titleRef = useRef(null)
  const formRef  = useRef(null)

  const isDirty =
    title.trim() !== '' ||
    desc.replace(/<[^>]*>/g, '').trim() !== '' ||
    startDate !== '' ||
    dueDate !== initialDate ||
    priority !== null ||
    assigneeId !== '' ||
    selectedLabels.length > 0 ||
    checklistItems.length > 0

  const handleClose = () => {
    if (isDirty) { setConfirmDiscard(true); return }
    onClose()
  }

  useEffect(() => {
    const onKeyDown = e => {
      if (e.key !== 'Escape') return
      if (confirmDiscard) { setConfirmDiscard(false); return }
      handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isDirty, onClose, confirmDiscard])

  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = (el.scrollHeight + el.offsetHeight - el.clientHeight) + 'px'
  }, [title])

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
      const text = title.trim() || desc.replace(/<[^>]*>/g, '').trim().split('\n')[0].slice(0, 80) || 'Untitled'
      const taskId = await onSave({
        text,
        description:  desc || null,
        start_date:   startDate || null,
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
      onClose()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const isCustomDate = dueDate && dueDate !== today && dueDate !== tomorrow && dueDate !== nextWeek

  return (
    <div
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="modal-sheet atp-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="atp-dialog-title"
      >

      {/* ── Header ──────────────────────────────────────── */}
      <div className="atp-hdr">
        <span className="atp-hdr__label" id="atp-dialog-title">New Task</span>
        <div className="atp-hdr__actions">
          <span className="atp-kbd" aria-hidden="true">⌘↵</span>
          <button className="modal-close" onClick={handleClose} aria-label="Close">
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
        <label className="atp-field-label" htmlFor="atp-title-input">Title</label>
        <textarea
          id="atp-title-input"
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
        <span className="atp-field-label">Description</span>
        <div className="atp-desc-editor">
          <TiptapEditor
            content={desc}
            onChange={setDesc}
            editable={true}
          />
        </div>

        <div className="atp-divider" aria-hidden="true" />

        {/* ── Properties ──────────────────────────────── */}
        <div className="atp-props" role="group" aria-label="Task properties">

          {/* Column */}
          <div className="atp-prop atp-prop--wrap">
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
              <div className="atp-col-pills" role="group" aria-label="Select column">
                {columns.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`atp-pill${status === c.id ? ' atp-pill--active atp-pill--col-active' : ''}`}
                    onClick={() => setStatus(c.id)}
                    aria-pressed={status === c.id}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
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
                      style={{ '--p-color': p.color }}
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

          {/* Date range */}
          <div className="atp-prop atp-prop--wrap">
            <span className="atp-prop__label" id="atp-due-label">Date range</span>
            <div className="atp-prop__val" role="group" aria-labelledby="atp-due-label">
              {/* Quick-picks set the end (due) date */}
              <div className="atp-pill-row">
                <button type="button" className={`atp-pill${dueDate === today    ? ' atp-pill--active' : ''}`} onClick={() => setDueDate(today)}    aria-pressed={dueDate === today}>Today</button>
                <button type="button" className={`atp-pill${dueDate === tomorrow ? ' atp-pill--active' : ''}`} onClick={() => setDueDate(tomorrow)} aria-pressed={dueDate === tomorrow}>Tomorrow</button>
                <button type="button" className={`atp-pill${dueDate === nextWeek ? ' atp-pill--active' : ''}`} onClick={() => setDueDate(nextWeek)} aria-pressed={dueDate === nextWeek}>Next week</button>
                <button type="button" className={`atp-pill${!dueDate && !startDate ? ' atp-pill--active' : ''}`} onClick={() => { setDueDate(''); setStartDate('') }} aria-pressed={!dueDate && !startDate}>None</button>
                {isCustomDate && (
                  <span className="atp-pill atp-pill--active" style={{ '--p-color': 'var(--accent)' }}>
                    {dayjs(dueDate).format('MMM D')}
                  </span>
                )}
              </div>
              {/* Start → End date range row */}
              <div className="atp-date-row atp-date-range-row">
                <div className="atp-date-range-field">
                  <label className="atp-date-range-label" htmlFor="atp-start-date">Start</label>
                  <input
                    id="atp-start-date"
                    type="date"
                    className="due-date-input"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    aria-label="Start date"
                  />
                </div>
                <span className="atp-date-range-sep" aria-hidden="true">→</span>
                <div className="atp-date-range-field">
                  <label className="atp-date-range-label" htmlFor="atp-end-date">End</label>
                  <input
                    id="atp-end-date"
                    type="date"
                    className="due-date-input"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    aria-label="End date"
                  />
                </div>
                <input
                  ref={timeRef}
                  type="time"
                  className="due-time-input"
                  defaultValue=""
                  disabled={!dueDate}
                  aria-label="Due time"
                />
                {(startDate || dueDate) && (
                  <button
                    type="button"
                    className="due-date-clear"
                    onClick={() => { setStartDate(''); setDueDate('') }}
                    aria-label="Clear dates"
                  >
                    <X size={14} weight="bold" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Assignee */}
          {workspaceTemplate !== 'job-tracker' && (!membersLoaded || members.length > 1) && (
            <div className="atp-prop atp-prop--assignee">
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
            <div className="atp-prop atp-prop--wrap atp-prop--labels">
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

        {/* ── Checklist ────────────────────────────────── */}
        <div className="atp-section">
          <div className="atp-section__hdr">
            <span className="atp-prop__label">
              Checklist
              {showChecklist && checklistItems.length > 0 && (
                <span className="task-panel-count">{checklistItems.length}</span>
              )}
            </span>
            {!showChecklist ? (
              <button
                type="button"
                className="task-doc-add-btn"
                onClick={() => setShowChecklist(true)}
              >
                + Add
              </button>
            ) : (
              <button
                type="button"
                className="atp-checklist__close"
                onClick={() => { setShowChecklist(false); setChecklistItems([]) }}
                aria-label="Remove checklist"
              >
                <X size={12} weight="bold" aria-hidden="true" />
              </button>
            )}
          </div>

          {showChecklist && (
            <>
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
              <form
                className="checklist-add-row"
                onSubmit={e => { e.preventDefault(); addChecklistItem() }}
              >
                <input
                  type="text"
                  className="checklist-add-input"
                  value={newChecklistText}
                  onChange={e => setNewChecklistText(e.target.value)}
                  placeholder="Add an item…"
                  aria-label="New checklist item"
                />
                <button
                  type="submit"
                  className="btn-primary checklist-add-btn"
                  disabled={!newChecklistText.trim()}
                >
                  Add
                </button>
              </form>
            </>
          )}
        </div>

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

      {/* ── Discard confirmation ─────────────────────────── */}
      {confirmDiscard && (
        <div className="discard-confirm">
          <div
            className="discard-confirm__card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="discard-title"
            aria-describedby="discard-msg"
          >
            <p className="discard-confirm__title" id="discard-title">Discard task?</p>
            <p className="discard-confirm__msg" id="discard-msg">Your changes will be lost.</p>
            <div className="discard-confirm__actions">
              <button className="btn-ghost" autoFocus onClick={() => setConfirmDiscard(false)}>
                Keep editing
              </button>
              <button className="btn-danger" onClick={() => { setConfirmDiscard(false); onClose() }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
