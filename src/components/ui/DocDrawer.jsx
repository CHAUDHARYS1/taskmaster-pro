import { useEffect, useState } from 'react'
import { X, ArrowSquareOut } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useDocuments } from '../../hooks/useDocuments'
import WritesEditor from '../writes/WritesEditor'

export default function DocDrawer({ docId, workspaceId, onClose, onOpenFull }) {
  const [doc,     setDoc]     = useState(null)
  const [loading, setLoading] = useState(true)
  const { updateDoc } = useDocuments(workspaceId)

  useEffect(() => {
    if (!docId) return
    setLoading(true)
    supabase
      .from('documents')
      .select('*')
      .eq('id', docId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) setDoc(data)
        setLoading(false)
      })
  }, [docId])

  const handleSave = async (updates) => {
    await updateDoc(docId, updates)
    setDoc(prev => ({ ...prev, ...updates }))
  }

  const handleDelete = async () => {
    onClose()
  }

  return (
    <>
      <div className="doc-drawer-overlay" onClick={onClose} aria-hidden="true" />
      <div
        className="doc-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={doc?.title || 'Document'}
      >
        <div className="doc-drawer-hdr">
          <span className="doc-drawer-title">{doc?.title || 'Untitled'}</span>
          <div className="doc-drawer-hdr-actions">
            <button
              className="btn-ghost doc-drawer-open-btn"
              onClick={onOpenFull}
              title="Open in Writes"
              aria-label="Open full document in Writes"
            >
              <ArrowSquareOut size={15} aria-hidden="true" />
              Open in Writes
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close document">
              <X size={18} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="doc-drawer-body">
          {loading ? (
            <div className="writes-editor-loading">Loading…</div>
          ) : doc ? (
            <WritesEditor
              key={doc.id}
              doc={doc}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ) : (
            <div className="writes-empty-state">
              <p className="writes-empty-msg">Could not load document.</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
