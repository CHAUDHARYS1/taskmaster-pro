import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, CaretLeft } from '@phosphor-icons/react'
import dayjs from 'dayjs'

export default function CalMobAddSheet({ date, workspaces, projects, onSelect, onClose }) {
  const skipWs = workspaces.length === 1
  const [step, setStep] = useState(skipWs ? 'project' : 'workspace')
  const [wsId, setWsId] = useState(skipWs ? workspaces[0]?.id : null)

  const selectedWs  = workspaces.find(w => w.id === wsId)
  const wsProjects  = projects.filter(p => p.workspace_id === wsId)

  const pickWorkspace = (id) => { setWsId(id); setStep('project') }
  const pickProject   = (projectId) => onSelect(wsId, projectId)

  return createPortal(
    <div
      className="cal-mob-add-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={step === 'workspace' ? 'Select workspace' : 'Select project'}
    >
      <div className="cal-mob-add-sheet" onClick={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div className="cal-mob-add-handle" aria-hidden="true" />

        {/* Header */}
        <div className="cal-mob-add-hdr">
          {step === 'project' && !skipWs ? (
            <button
              type="button"
              className="cal-mob-add-back"
              onClick={() => setStep('workspace')}
              aria-label="Back to workspace selection"
            >
              <CaretLeft size={16} weight="bold" aria-hidden="true" />
            </button>
          ) : (
            <div className="cal-mob-add-back-spacer" />
          )}

          <div className="cal-mob-add-hdr-center">
            <span className="cal-mob-add-title">
              {step === 'workspace' ? 'Select workspace' : 'Select project'}
            </span>
            <span className="cal-mob-add-date">
              {dayjs(date).format('MMMM D, YYYY')}
            </span>
          </div>

          <button
            type="button"
            className="cal-mob-add-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Workspace step */}
        {step === 'workspace' && (
          <div className="cal-mob-add-list" role="list">
            {workspaces.map(ws => (
              <button
                key={ws.id}
                type="button"
                className="cal-mob-add-item"
                onClick={() => pickWorkspace(ws.id)}
                role="listitem"
              >
                <span
                  className="cal-mob-add-swatch"
                  style={{ background: ws.color || 'var(--accent)' }}
                  aria-hidden="true"
                />
                <span className="cal-mob-add-item-name">{ws.name}</span>
                <span className="cal-mob-add-item-meta">
                  {projects.filter(p => p.workspace_id === ws.id).length} project
                  {projects.filter(p => p.workspace_id === ws.id).length !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Project step */}
        {step === 'project' && (
          <>
            {!skipWs && selectedWs && (
              <div className="cal-mob-add-ws-tag">
                <span
                  className="cal-mob-add-swatch cal-mob-add-swatch--sm"
                  style={{ background: selectedWs.color || 'var(--accent)' }}
                  aria-hidden="true"
                />
                <span>{selectedWs.name}</span>
              </div>
            )}
            <div className="cal-mob-add-list" role="list">
              {wsProjects.length === 0 ? (
                <p className="cal-mob-add-empty">No projects in this workspace.</p>
              ) : wsProjects.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="cal-mob-add-item"
                  onClick={() => pickProject(p.id)}
                  role="listitem"
                >
                  <span
                    className="cal-mob-add-swatch"
                    style={{ background: p.color || 'var(--ink-3)' }}
                    aria-hidden="true"
                  />
                  <span className="cal-mob-add-item-name">{p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
