import { useEffect, useRef, useState } from 'react'
import { useTaskDocuments } from '../../hooks/useTaskDocuments'
import { useDocuments } from '../../hooks/useDocuments'

export default function TaskDocumentLink({ taskId, workspaceId, onOpenDoc }) {
  const { linkedDocs, addDoc, removeDoc } = useTaskDocuments(taskId)
  const { docs } = useDocuments(workspaceId)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [query,      setQuery]      = useState('')
  const inputRef  = useRef(null)
  const pickerRef = useRef(null)

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  // Focus input when picker opens
  useEffect(() => {
    if (pickerOpen) inputRef.current?.focus()
  }, [pickerOpen])

  const linkedIds = new Set(linkedDocs.map(d => d.id))
  const filtered  = docs.filter(d =>
    !linkedIds.has(d.id) &&
    (d.title || 'Untitled').toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (doc) => {
    addDoc(doc.id)
    setPickerOpen(false)
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setPickerOpen(false); setQuery('') }
  }

  return (
    <div className="task-panel-section">
      <div className="task-doc-hdr">
        <p className="task-panel-label">Linked Documents</p>
        <button
          className="btn-ghost task-doc-add-btn"
          onClick={() => setPickerOpen(v => !v)}
          aria-label="Link a document"
          title="Link document (@)"
        >
          @
        </button>
      </div>

      {linkedDocs.length > 0 && (
        <div className="task-doc-chips">
          {linkedDocs.map(doc => (
            <span key={doc.id} className="task-doc-chip">
              <button
                className="task-doc-chip-title"
                onClick={() => onOpenDoc(doc.id)}
                title={`Open ${doc.title || 'Untitled'}`}
              >
                @{doc.title || 'Untitled'}
              </button>
              <button
                className="task-doc-chip-remove"
                onClick={() => removeDoc(doc.id)}
                aria-label={`Unlink ${doc.title || 'Untitled'}`}
                title="Unlink"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {pickerOpen && (
        <div className="task-doc-picker" ref={pickerRef}>
          <input
            ref={inputRef}
            className="task-doc-picker-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documents…"
            aria-label="Search documents to link"
          />
          <ul className="task-doc-picker-list">
            {filtered.length === 0 ? (
              <li className="task-doc-picker-empty">
                {docs.length === 0 ? 'No documents in this workspace' : 'No matches'}
              </li>
            ) : (
              filtered.map(doc => (
                <li key={doc.id}>
                  <button
                    className="task-doc-picker-item"
                    onMouseDown={e => { e.preventDefault(); handleSelect(doc) }}
                  >
                    {doc.title || 'Untitled'}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
