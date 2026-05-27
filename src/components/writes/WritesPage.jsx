import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useDocuments } from '../../hooks/useDocuments'
import Sidebar from '../layout/Sidebar'
import WritesEditor from './WritesEditor'

export default function WritesPage() {
  const { currentWorkspace, loading: wsLoading } = useWorkspace()
  const { toast }   = useToast()
  const { docs, loading, createDoc, updateDoc, deleteDoc, fetchDocContent } = useDocuments(currentWorkspace?.id)

  const [selectedId,  setSelectedId]  = useState(null)
  const [currentDoc,  setCurrentDoc]  = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [docLoading,  setDocLoading]  = useState(false)

  // Load full content when selection changes
  useEffect(() => {
    if (!selectedId) { setCurrentDoc(null); return }
    setDocLoading(true)
    fetchDocContent(selectedId)
      .then(setCurrentDoc)
      .catch(err => toast.error(err.message || 'Failed to load document'))
      .finally(() => setDocLoading(false))
  }, [selectedId])

  // Auto-select first doc when list loads
  useEffect(() => {
    if (!selectedId && docs.length > 0) setSelectedId(docs[0].id)
  }, [docs])

  const handleNew = async () => {
    try {
      const doc = await createDoc()
      setSelectedId(doc.id)
    } catch (err) {
      toast.error(err.message || 'Failed to create document')
    }
  }

  const handleSave = async (updates) => {
    await updateDoc(selectedId, updates)
    setCurrentDoc(prev => ({ ...prev, ...updates }))
  }

  const handleDelete = async () => {
    if (!selectedId) return
    const title = currentDoc?.title || 'Untitled'
    try {
      await deleteDoc(selectedId)
      toast.success(`"${title}" deleted`)
      setSelectedId(null)
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
                    className={`writes-list-item${selectedId === doc.id ? ' writes-list-item--active' : ''}`}
                    onClick={() => setSelectedId(doc.id)}
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
