import { useCallback, useEffect, useRef, useState } from 'react'
import { MagnifyingGlass, NotePencil, Plus, PushPin } from '@phosphor-icons/react'
import { fmtDate } from '../../utils/format'
import { useDocuments } from '../../hooks/useDocuments'
import { useToast } from '../../contexts/ToastContext'
import WritesEditor from '../writes/WritesEditor'
import { DocPreviewSheet, DocEditSheet } from '../writes/DocSheets'

function DocCard({ doc, isSelected, onClick, onPin }) {
  return (
    <button
      className={`wr-note${isSelected ? ' wr-note--active' : ''}`}
      onClick={onClick}
    >
      <div className="wr-note-top">
        <span className="wr-note-title">{doc.title || 'Untitled'}</span>
        <button
          className="wr-pin-ico"
          style={{ opacity: doc.pinned ? 1 : 0.25 }}
          onClick={e => onPin(doc, e)}
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
  )
}

export default function WritesView({ workspaceId, onDocsChange }) {
  const { toast }    = useToast()
  const lastSaveRef  = useRef(0)

  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false)
  const [selectedDocId,  setSelectedDocId]  = useState(null)
  const [currentDoc,     setCurrentDoc]     = useState(null)
  const [docLoading,     setDocLoading]     = useState(false)
  const [search,         setSearch]         = useState('')
  const [isMobile,       setIsMobile]       = useState(() => window.innerWidth <= 768)
  const [previewDoc,     setPreviewDoc]     = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [editDoc,        setEditDoc]        = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null) // id hidden while undo timer runs

  const handleRemoteDocUpdate = useCallback((updatedDoc) => {
    if (updatedDoc.id !== selectedDocId) return
    if (Date.now() - lastSaveRef.current < 3000) return
    if (Date.now() - lastSaveRef.current > 5000) {
      setCurrentDoc(updatedDoc)
    } else {
      setRemoteUpdateAvailable(true)
    }
  }, [selectedDocId])

  const { docs, loading, createDoc, updateDoc, deleteDoc, fetchDocContent, pinDoc } =
    useDocuments(workspaceId, { onRemoteUpdate: handleRemoteDocUpdate })

  useEffect(() => {
    onDocsChange?.(docs.length)
  }, [docs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Auto-select first doc on desktop when list loads
  useEffect(() => {
    if (!isMobile && !selectedDocId && docs.length > 0) {
      selectDoc(docs[0].id)
    }
  }, [docs, isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectDoc = async (id) => {
    if (isMobile) {
      // Mobile: open preview sheet
      const partial = docs.find(d => d.id === id) ?? { id }
      setPreviewDoc(partial)
      setPreviewLoading(true)
      try {
        const full = await fetchDocContent(id)
        setPreviewDoc(full)
      } catch (err) {
        toast.error(err.message || 'Failed to load document')
      } finally {
        setPreviewLoading(false)
      }
      return
    }
    setSelectedDocId(id)
    setRemoteUpdateAvailable(false)
    setDocLoading(true)
    try {
      const full = await fetchDocContent(id)
      setCurrentDoc(full)
    } catch (err) {
      toast.error(err.message || 'Failed to load document')
    } finally {
      setDocLoading(false)
    }
  }

  const handleNew = async () => {
    try {
      const doc = await createDoc(workspaceId)
      if (isMobile) {
        setEditDoc(doc)
      } else {
        setSelectedDocId(doc.id)
        setCurrentDoc(doc)
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create document')
    }
  }

  const handleSave = async (updates) => {
    if (!selectedDocId) return
    lastSaveRef.current = Date.now()
    await updateDoc(selectedDocId, updates)
    setCurrentDoc(prev => ({ ...prev, ...updates }))
  }

  const handleDelete = () => {
    if (!selectedDocId) return
    const id = selectedDocId
    const saved = currentDoc
    const title = saved?.title || 'Untitled'

    // Optimistically clear the editor and hide from list
    setSelectedDocId(null)
    setCurrentDoc(null)
    setPendingDeleteId(id)

    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      setPendingDeleteId(null)
      try { await deleteDoc(id) }
      catch (err) { toast.error(err.message || 'Failed to delete document') }
    }, 4000)

    toast.undo(`"${title}" deleted`, () => {
      cancelled = true
      clearTimeout(timer)
      setPendingDeleteId(null)
      setSelectedDocId(id)
      setCurrentDoc(saved)
    })
  }

  const handleReloadContent = async () => {
    setRemoteUpdateAvailable(false)
    setDocLoading(true)
    try {
      const fresh = await fetchDocContent(selectedDocId)
      setCurrentDoc(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to reload document')
    } finally {
      setDocLoading(false)
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

  // Mobile sheet handlers
  const handleSheetSave = async (updates) => {
    if (!editDoc) return
    lastSaveRef.current = Date.now()
    await updateDoc(editDoc.id, updates)
    setEditDoc(prev => ({ ...prev, ...updates }))
  }

  const handleSheetDelete = () => {
    if (!editDoc) return
    const id = editDoc.id
    const saved = editDoc
    const title = saved.title || 'Untitled'

    setEditDoc(null)
    setPendingDeleteId(id)

    let cancelled = false
    const timer = setTimeout(async () => {
      if (cancelled) return
      setPendingDeleteId(null)
      try { await deleteDoc(id) }
      catch (err) { toast.error(err.message || 'Failed to delete document') }
    }, 4000)

    toast.undo(`"${title}" deleted`, () => {
      cancelled = true
      clearTimeout(timer)
      setPendingDeleteId(null)
      setEditDoc(saved)
    })
  }

  const q = search.trim().toLowerCase()
  const visible  = pendingDeleteId ? docs.filter(d => d.id !== pendingDeleteId) : docs
  const filtered = q ? visible.filter(d => (d.title || '').toLowerCase().includes(q)) : visible
  const sorted   = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  return (
    <>
      <div className="writes-view-embed">
        {/* ── Left: doc list ── */}
        <div className="wr-list writes-view-embed__list">
          <div className="wr-list-head">
            <div className="wr-search">
              <i><MagnifyingGlass size={13} aria-hidden="true" /></i>
              <input
                placeholder="Search notes…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search documents"
              />
            </div>
            <button className="wr-new" onClick={handleNew} aria-label="New document">
              + New note
            </button>
          </div>

          <div className="wr-notes">
            {loading ? (
              <p className="writes-list-empty">Loading…</p>
            ) : docs.length === 0 ? (
              <p className="writes-list-empty">No documents yet.</p>
            ) : sorted.length === 0 ? (
              <p className="writes-list-empty">No matches for "{search}".</p>
            ) : (
              sorted.map(doc => (
                <DocCard
                  key={doc.id}
                  doc={doc}
                  isSelected={doc.id === selectedDocId}
                  onClick={() => selectDoc(doc.id)}
                  onPin={handlePin}
                />
              ))
            )}
          </div>

          {/* Mobile FAB */}
          <div className="wr-fab-wrap">
            <button className="wr-fab" onClick={handleNew} aria-label="New note">
              <Plus size={26} weight="bold" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ── Right: editor (desktop only) ── */}
        <div className="writes-editor-area">
          {docLoading ? (
            <div className="writes-editor-loading">Loading…</div>
          ) : currentDoc ? (
            <WritesEditor
              key={currentDoc.id}
              doc={currentDoc}
              onSave={handleSave}
              onDelete={handleDelete}
              remoteUpdateAvailable={remoteUpdateAvailable}
              onReloadContent={handleReloadContent}
            />
          ) : (
            <div className="writes-empty-state">
              <p className="writes-empty-msg">
                {docs.length === 0
                  ? 'No documents yet. Create one to get started.'
                  : 'Select a document to open it.'}
              </p>
              {docs.length === 0 && (
                <button className="btn-primary" onClick={handleNew}>+ New document</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sheets */}
      {isMobile && previewDoc && (
        <DocPreviewSheet
          doc={previewDoc}
          wsLabel={null}
          loading={previewLoading}
          onEdit={() => { setEditDoc(previewDoc); setPreviewDoc(null) }}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {isMobile && editDoc && (
        <DocEditSheet
          doc={editDoc}
          onSave={handleSheetSave}
          onDelete={handleSheetDelete}
          onClose={() => setEditDoc(null)}
        />
      )}
    </>
  )
}
