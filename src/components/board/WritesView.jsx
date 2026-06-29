import { useNavigate } from 'react-router-dom'
import { NotePencil, PushPin } from '@phosphor-icons/react'
import { useDocuments } from '../../hooks/useDocuments'
import { useToast } from '../../contexts/ToastContext'
import { fmtDate } from '../../utils/format'

export default function WritesView({ workspaceId }) {
  const navigate    = useNavigate()
  const { toast }   = useToast()
  const { docs, loading, createDoc, pinDoc } = useDocuments(workspaceId)

  const handleNew = async () => {
    try {
      const doc = await createDoc(workspaceId)
      navigate('/writes/' + doc.id)
    } catch (err) {
      toast.error(err.message || 'Failed to create document')
    }
  }

  const handlePin = async (doc, e) => {
    e.stopPropagation()
    try {
      await pinDoc(doc.id, !doc.pinned)
    } catch (err) {
      toast.error(err.message || 'Failed to update pin')
    }
  }

  if (loading) return <div className="writes-view-loading">Loading documents…</div>

  const sorted = [...docs].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <div className="writes-view">
      <div className="writes-view-head">
        <h2 className="writes-view-title">Documents</h2>
        <button className="btn-primary btn-sm writes-view-new" onClick={handleNew}>
          <NotePencil size={14} aria-hidden="true" />
          New note
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="writes-view-empty">
          <NotePencil size={40} className="writes-view-empty-icon" weight="light" aria-hidden="true" />
          <p className="writes-view-empty-msg">No documents in this workspace yet.</p>
          <button className="btn-primary" onClick={handleNew}>+ New document</button>
        </div>
      ) : (
        <div className="writes-view-list">
          {sorted.map(doc => (
            <button
              key={doc.id}
              className="wr-note"
              onClick={() => navigate('/writes/' + doc.id)}
            >
              <div className="wr-note-top">
                <span className="wr-note-title">{doc.title || 'Untitled'}</span>
                <button
                  className="wr-pin-ico"
                  style={{ opacity: doc.pinned ? 1 : 0.25 }}
                  onClick={e => handlePin(doc, e)}
                  aria-label={doc.pinned ? 'Unpin document' : 'Pin document'}
                >
                  <PushPin size={16} weight={doc.pinned ? 'fill' : 'regular'} aria-hidden="true" />
                </button>
              </div>
              {doc.preview && <p className="wr-note-snip">{doc.preview}</p>}
              <div className="wr-note-meta">
                <span>{fmtDate(doc.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
