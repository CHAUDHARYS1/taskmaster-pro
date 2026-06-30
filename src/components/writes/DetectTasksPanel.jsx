import { useEffect, useRef, useState } from 'react'
import { X, CheckSquare, Square } from '@phosphor-icons/react'
import { detectTasksFromText } from '../../lib/taskDetection'
import { supabase } from '../../lib/supabase'

function confidenceColor(score) {
  if (score >= 6) return 'var(--green)'
  if (score >= 4) return 'var(--accent)'
  return 'var(--ink-4)'
}

function confidenceLabel(score) {
  if (score >= 6) return 'High match'
  if (score >= 4) return 'Likely task'
  return 'Possible task'
}

export default function DetectTasksPanel({ editorText, workspaceId, onClose }) {
  const [projects, setProjects]     = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected]     = useState(new Set())
  const [edits, setEdits]           = useState({}) // index → { text, dueDate }
  const [projectId, setProjectId]   = useState(null)
  const [adding, setAdding]         = useState(false)
  const [addError, setAddError]     = useState(null)
  const panelRef = useRef(null)

  // One-time fetch — avoids subscribing to a realtime channel already open elsewhere
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

  // Run detection once on mount
  useEffect(() => {
    const results = detectTasksFromText(editorText)
    setCandidates(results)
    setSelected(new Set(results.map((_, i) => i)))
  }, [editorText])

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

  const editText = (i, text) =>
    setEdits(prev => ({ ...prev, [i]: { ...prev[i], text } }))

  const editDate = (i, dueDate) =>
    setEdits(prev => ({ ...prev, [i]: { ...prev[i], dueDate } }))

  const getTaskText = (i) => edits[i]?.text ?? candidates[i]?.text ?? ''
  const getTaskDate = (i) =>
    edits[i]?.hasOwnProperty('dueDate')
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

  return (
    <>
      <div className="ws-panel-overlay" onClick={() => onClose()} aria-hidden="true" />
      <div className="ws-panel dtk-panel" role="dialog" aria-modal="true" aria-label="Detected tasks" ref={panelRef}>

        {/* Header */}
        <div className="ws-panel-hdr dtk-hdr">
          <div className="dtk-hdr-title">
            <span className="dtk-hdr-heading">Detected Tasks</span>
            {candidates.length > 0 && (
              <span className="dtk-badge">{candidates.length}</span>
            )}
          </div>
          <button className="ws-panel-close" onClick={() => onClose()} aria-label="Close panel">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="dtk-body">
          {candidates.length === 0 ? (
            <div className="dtk-empty">
              <p className="dtk-empty-title">No tasks detected</p>
              <p className="dtk-empty-sub">Try adding action items, checklists, or sentences starting with verbs like "Call", "Schedule", or "Review".</p>
            </div>
          ) : (
            <>
              <div className="dtk-select-all-row">
                <button className="dtk-select-all" onClick={toggleAll}>
                  {selected.size === candidates.length ? <CheckSquare size={14} weight="bold" /> : <Square size={14} />}
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
                          : <Square size={16} style={{ color: 'var(--ink-4)' }} />
                        }
                      </button>

                      <div className="dtk-card-body">
                        <div className="dtk-card-top">
                          <input
                            className="dtk-task-input"
                            value={getTaskText(i)}
                            onChange={e => editText(i, e.target.value)}
                            aria-label="Task text"
                            disabled={!isOn}
                          />
                          <span
                            className="dtk-dot"
                            style={{ background: confidenceColor(c.confidence) }}
                            title={confidenceLabel(c.confidence)}
                            aria-label={confidenceLabel(c.confidence)}
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
                              onChange={e => editDate(i, e.target.value)}
                              aria-label="Due date"
                            />
                            {getTaskDate(i) && (
                              <button
                                className="dtk-date-clear"
                                onClick={() => editDate(i, '')}
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
        {candidates.length > 0 && (
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
