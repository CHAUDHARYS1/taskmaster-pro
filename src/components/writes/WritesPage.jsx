import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { List } from '@phosphor-icons/react'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useDocuments } from '../../hooks/useDocuments'
import Sidebar from '../layout/Sidebar'
import WritesEditor from './WritesEditor'

export default function WritesPage() {
  const { docId }    = useParams()
  const navigate     = useNavigate()
  const { currentWorkspace, loading: wsLoading } = useWorkspace()
  const { toast }    = useToast()
  const { docs, loading, createDoc, updateDoc, deleteDoc, fetchDocContent } = useDocuments(currentWorkspace?.id)

  const [currentDoc,  setCurrentDoc]  = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [docLoading,  setDocLoading]  = useState(false)

  // Load full content when docId changes
  useEffect(() => {
    if (!docId) { setCurrentDoc(null); return }
    setDocLoading(true)
    fetchDocContent(docId)
      .then(setCurrentDoc)
      .catch(err => toast.error(err.message || 'Failed to load document'))
      .finally(() => setDocLoading(false))
  }, [docId])

  // Auto-navigate to first doc when no docId in URL
  useEffect(() => {
    if (!docId && docs.length > 0) navigate('/writes/' + docs[0].id, { replace: true })
  }, [docs, docId])

  const handleNew = async () => {
    try {
      const doc = await createDoc()
      navigate('/writes/' + doc.id)
    } catch (err) {
      toast.error(err.message || 'Failed to create document')
    }
  }

  const handleSave = async (updates) => {
    await updateDoc(docId, updates)
    setCurrentDoc(prev => ({ ...prev, ...updates }))
  }

  const handleDelete = async () => {
    if (!docId) return
    const title = currentDoc?.title || 'Untitled'
    try {
      await deleteDoc(docId)
      toast.success(`"${title}" deleted`)
      navigate('/writes', { replace: true })
      setCurrentDoc(null)
    } catch (err) {
      toast.error(err.message || 'Failed to delete document')
    }
  }

  if (wsLoading) return <div className="loading-screen">Loading…</div>

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} onShowShortcuts={() => {}} />

      <main className="writes-main">
        {/* Document list panel */}
        <aside className="writes-list-panel">
          <div className="writes-list-hdr">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <h2 className="writes-list-heading">Writes</h2>
            <button className="btn-primary btn-sm" onClick={handleNew} aria-label="New document">
              + New
            </button>
          </div>

          {loading ? (
            <p className="writes-list-empty">Loading…</p>
          ) : docs.length === 0 ? (
            <p className="writes-list-empty">No documents yet.</p>
          ) : (
            <ul className="writes-list">
              {docs.map(doc => (
                <li key={doc.id}>
                  <button
                    className={`writes-list-item${docId === doc.id ? ' writes-list-item--active' : ''}`}
                    onClick={() => navigate('/writes/' + doc.id)}
                  >
                    <span className="writes-list-item-title">{doc.title || 'Untitled'}</span>
                    <span className="writes-list-item-date">{dayjs(doc.updated_at).format('MMM D')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Editor area */}
        <div className="writes-editor-area">
          {docLoading ? (
            <div className="writes-editor-loading">Loading…</div>
          ) : currentDoc ? (
            <WritesEditor
              key={currentDoc.id}
              doc={currentDoc}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ) : (
            <div className="writes-empty-state">
              <p className="writes-empty-msg">Select a document or create a new one to get started.</p>
              <button className="btn-primary" onClick={handleNew}>+ New document</button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
