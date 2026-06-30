import { useEffect, useRef, useState } from 'react'
import { X, CheckSquare, Square, ArrowClockwise } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'

function SkeletonCard() {
  return (
    <div className="dtk-skeleton-card" aria-hidden="true">
      <div className="dtk-skeleton dtk-skeleton--icon" />
      <div className="dtk-skeleton-lines">
        <div className="dtk-skeleton dtk-skeleton--title" />
        <div className="dtk-skeleton dtk-skeleton--sub" />
      </div>
    </div>
  )
}

export default function DetectTasksPanel({
  initialCandidates,
  loading,
  error,
  onRetry,
  workspaceId,
  onClose,
}) {
  const [projects, setProjects]               = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [candidates, setCandidates]           = useState([])
  const [selected, setSelected]               = useState(new Set())
  const [edits, setEdits]                     = useState({})
  const [projectId, setProjectId]             = useState(null)
  const [adding, setAdding]                   = useState(false)
  const [addError, setAddError]               = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('workspace_id', workspaceId)
      .order('position', { ascending: true })
      .then(({ data }) => {
        const list = data ?? []
        setProjects(list)
        if (list.length > 0) setProjectId(list[0].id)
        setProjectsLoading(false)
      })
  }, [workspaceId])

  useEffect(() => {
    const list = initialCandidates ?? []
    setCandidates(list)
    setSelected(new Set(list.map((_, i) => i)))
    setEdits({})
  }, [initialCandidates])

  const toggleAll = () => {
    if (selected.size === candidates.length) setSelected(new Set())
    else setSelected(new Set(candidates.map((_, i) => i)))
  }

  const toggle = (i) => {
    const next = new Set(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setSelected(next)
  }

  const editField = (i, field, value) =>
    setEdits(prev => ({ ...prev, [i]: { ...prev[i], [field]: value } }))

  const getTaskText = (i) => edits[i]?.text ?? candidates[i]?.text ?? ''
  const getTaskDate = (i) => edits[i]?.hasOwnProperty('dueDate')
    ? edits[i].dueDate
    : candidates[i]?.suggestedDueDate ?? ''

  const selectedCount = [...selected].filter(i => getTaskText(i).trim()).length

  const handleAddToBoard = async () => {
    if (!projectId || selectedCount === 0) return
    setAdding(true)
    setAddError(null)
    try {
      const rows = [...selected]
        .filter(i => getTaskText(i).trim())
        .map((i, order) => ({
          workspace_id: workspaceId,
          project_id:   projectId,
          text:         getTaskText(i).trim(),
          due_date:     getTaskDate(i) || null,
          status:       'toDo',
          position:     -(Date.now() + order),
          labels:       [],
        }))

      const { error } = await supabase.from('tasks').insert(rows)
      if (error) throw error
      onClose('added', selectedCount)
    } catch (err) {
      setAddError(err.message || 'Failed to add tasks')
      setAdding(false)
    }
  }

  const showFooter = !loading && !error && candidates.length > 0

  return (
    <>
      <div className="ws-panel-overlay" onClick={() => onClose()} aria-hidden="true" />
      <div className="ws-panel dtk-panel" role="dialog" aria-modal="true" aria-label="Detected tasks" ref={panelRef}>

        {/* Header */}
        <div className="ws-panel-hdr dtk-hdr">
          <div className="dtk-hdr-title">
            <span className="dtk-hdr-heading">Detect Tasks</span>
            {!loading && !error && candidates.length > 0 && (
              <span className="dtk-badge">{candidates.length}</span>
            )}
          </div>
          <div className="dtk-hdr-actions">
            <button className="ws-panel-close" onClick={() => onClose()} aria-label="Close panel">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="dtk-body">

          {/* Loading skeleton */}
          {loading && (
            <div className="dtk-loading" aria-label="Detecting tasks…">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <p className="dtk-loading-label">AI is reading your document…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="dtk-error-state">
              <p className="dtk-error-msg">{error}</p>
              <button className="dtk-retry-btn" onClick={onRetry}>
                <ArrowClockwise size={14} aria-hidden="true" />
                Try again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && candidates.length === 0 && (
            <div className="dtk-empty">
              <p className="dtk-empty-title">No tasks detected</p>
              <p className="dtk-empty-sub">Try writing clear action items — checkboxes, bullet points, numbered lists, or sentences like "Schedule a call with the team by Friday."</p>
              <button className="dtk-retry-btn dtk-retry-btn--inline" onClick={onRetry}>
                <ArrowClockwise size={14} aria-hidden="true" />
                Try again
              </button>
            </div>
          )}

          {/* Candidates */}
          {!loading && !error && candidates.length > 0 && (
            <>
              <div className="dtk-select-all-row">
                <button className="dtk-select-all" onClick={toggleAll}>
                  {selected.size === candidates.length
                    ? <CheckSquare size={14} weight="bold" />
                    : <Square size={14} />}
                  {selected.size === candidates.length ? 'Deselect all' : 'Select all'}
                </button>
                <span className="dtk-count">{selected.size} of {candidates.length} selected</span>
              </div>

              <ul className="dtk-list" role="list">
                {candidates.map((c, i) => {
                  const isOn = selected.has(i)
                  return (
                    <li key={i} className={`dtk-card${isOn ? ' dtk-card--on' : ''}`} role="listitem">
                      <button
                        className="dtk-checkbox"
                        onClick={() => toggle(i)}
                        aria-pressed={isOn}
                        aria-label={isOn ? 'Exclude task' : 'Include task'}
                      >
                        {isOn
                          ? <CheckSquare size={16} weight="bold" style={{ color: 'var(--accent)' }} />
                          : <Square size={16} style={{ color: 'var(--ink-4)' }} />}
                      </button>

                      <div className="dtk-card-body">
                        <div className="dtk-card-top">
                          <input
                            className="dtk-task-input"
                            value={getTaskText(i)}
                            onChange={e => editField(i, 'text', e.target.value)}
                            aria-label="Task title"
                            disabled={!isOn}
                          />
                        </div>

                        {isOn && (
                          <div className="dtk-date-row">
                            <label className="dtk-date-label" htmlFor={`dtk-date-${i}`}>Due date</label>
                            <input
                              id={`dtk-date-${i}`}
                              className="dtk-date-input"
                              type="date"
                              value={getTaskDate(i)}
                              onChange={e => editField(i, 'dueDate', e.target.value)}
                              aria-label="Due date"
                            />
                            {getTaskDate(i) && (
                              <button
                                className="dtk-date-clear"
                                onClick={() => editField(i, 'dueDate', '')}
                                aria-label="Clear date"
                              >×</button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        {showFooter && (
          <div className="dtk-footer">
            {addError && <p className="dtk-error">{addError}</p>}

            <div className="dtk-footer-row">
              <div className="dtk-project-wrap">
                <label className="dtk-project-label" htmlFor="dtk-project">Add to</label>
                {projectsLoading ? (
                  <span className="dtk-project-loading">Loading…</span>
                ) : (
                  <select
                    id="dtk-project"
                    className="dtk-project-select"
                    value={projectId ?? ''}
                    onChange={e => setProjectId(e.target.value)}
                    aria-label="Target project"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <button
                className="btn-primary dtk-add-btn"
                onClick={handleAddToBoard}
                disabled={adding || selectedCount === 0 || !projectId}
              >
                {adding ? 'Adding…' : `Add ${selectedCount} task${selectedCount !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
