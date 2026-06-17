import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  List, NotePencil, MagnifyingGlass, PushPin, ArrowLeft, Plus, PencilSimple, X,
} from '@phosphor-icons/react'
import PageHint from '../ui/PageHint'
import { BellButton } from '../notifications/NotificationCenter'

const SettingsModal = lazy(() => import('../ui/SettingsModal'))
import { fmtDate } from '../../utils/format'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import { useToast } from '../../contexts/ToastContext'
import { useDocuments } from '../../hooks/useDocuments'
import Sidebar from '../layout/Sidebar'
import WritesEditor from './WritesEditor'

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return fmtDate(dateStr)
}

function DocPreviewSheet({ doc, wsMap, loading, onEdit, onClose }) {
  const ws = wsMap[doc.workspace_id]
  const [expanded, setExpanded] = useState(false)
  const touchStartY = useRef(null)

  const onHandleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY
  }
  const onHandleTouchEnd = (e) => {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    touchStartY.current = null
    if (delta > 40) { setExpanded(true); return }
    if (delta < -40) { expanded ? setExpanded(false) : onClose() }
  }

  const height = expanded ? '100dvh' : '50dvh'

  return (
    <>
      <div className="doc-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="doc-sheet"
        style={{ height, transition: 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)' }}
        role="dialog" aria-modal="true" aria-label={doc.title || 'Untitled'}
      >
        <div
          className="doc-sheet-handle"
          aria-hidden="true"
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
        />
        <div className="doc-sheet-bar">
          <span className="doc-sheet-ws">{ws?.name ?? ''}</span>
          <div className="doc-sheet-actions">
            <button className="doc-sheet-btn" onClick={onEdit} aria-label="Edit document">
              <PencilSimple size={18} aria-hidden="true" />
            </button>
            <button className="doc-sheet-btn" onClick={onClose} aria-label="Close preview">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="doc-sheet-body">
          <h1 className="doc-sheet-title">{doc.title || 'Untitled'}</h1>
          <p className="doc-sheet-edited">Edited {timeAgo(doc.updated_at)}</p>
          {loading ? (
            <p className="doc-sheet-loading">Loading…</p>
          ) : (
            <div
              className="doc-sheet-content tiptap"
              dangerouslySetInnerHTML={{ __html: doc.content || '' }}
            />
          )}
        </div>
      </div>
    </>
  )
}

function DocItem({ doc, docId, wsMap, onNavigate, onPin }) {
  const ws = wsMap[doc.workspace_id]
  return (
    <button
      className={`wr-note${docId === doc.id ? ' on' : ''}`}
      onClick={() => onNavigate(doc.id)}
    >
      <div className="wr-note-top">
        <span className="wr-note-title">{doc.title || 'Untitled'}</span>
        <button
          className="wr-pin-ico"
          style={{ opacity: doc.pinned ? 1 : 0.25 }}
          onClick={e => onPin(doc, e)}
          aria-label={doc.pinned ? 'Unpin document' : 'Pin document'}
        >
          <PushPin size={18} weight={doc.pinned ? 'fill' : 'regular'} aria-hidden="true" />
        </button>
      </div>
      {doc.preview && <p className="wr-note-snip">{doc.preview}</p>}
      <div className="wr-note-meta">
        {ws?.name && (
          <>
            <span className="wr-note-meta-ws">{ws.name}</span>
            <span className="wr-note-meta-dot" aria-hidden="true">·</span>
          </>
        )}
        <span>{fmtDate(doc.updated_at)}</span>
      </div>
    </button>
  )
}

export default function WritesPage() {
  const { docId }    = useParams()
  const navigate     = useNavigate()
  const { currentWorkspace, workspaces } = useWorkspace()
  const { toast }    = useToast()

  // Track our own saves so we can ignore the realtime echo of our own writes
  const lastSaveRef = useRef(0)
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false)

  const handleRemoteDocUpdate = useCallback((updatedDoc) => {
    if (updatedDoc.id !== docId) return
    if (Date.now() - lastSaveRef.current < 3000) return // own save echoing back
    setRemoteUpdateAvailable(true)
  }, [docId])

  const wsIds = workspaces.map(w => w.id)
  const { docs, loading, createDoc, updateDoc, deleteDoc, fetchDocContent, pinDoc } = useDocuments(
    wsIds.length ? wsIds : null,
    { onRemoteUpdate: handleRemoteDocUpdate }
  )

  const [currentDoc,  setCurrentDoc]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [isMobile,    setIsMobile]    = useState(() => window.innerWidth <= 768)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [docLoading,  setDocLoading]  = useState(false)
  const [previewDoc,  setPreviewDoc]  = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [showSettings,  setShowSettings]  = useState(false)
  const [showWsPicker,  setShowWsPicker]  = useState(false)
  const wsPickerRef = useRef(null)
  const fabRef      = useRef(null)

  useEffect(() => {
    if (!showWsPicker) return
    const handler = (e) => {
      const inList = wsPickerRef.current && wsPickerRef.current.contains(e.target)
      const inFab  = fabRef.current      && fabRef.current.contains(e.target)
      if (!inList && !inFab) setShowWsPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showWsPicker])

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    if (!docId) { setCurrentDoc(null); return }
    setRemoteUpdateAvailable(false)
    setDocLoading(true)
    fetchDocContent(docId)
      .then(setCurrentDoc)
      .catch(err => toast.error(err.message || 'Failed to load document'))
      .finally(() => setDocLoading(false))
  }, [docId])

  useEffect(() => {
    if (!docId && docs.length > 0 && window.innerWidth > 768) {
      navigate('/writes/' + docs[0].id, { replace: true })
    }
  }, [docs, docId])

  const doCreateDoc = async (wsId) => {
    try {
      const doc = await createDoc(wsId)
      navigate('/writes/' + doc.id)
    } catch (err) {
      toast.error(err.message || 'Failed to create document')
    }
  }

  const handleNew = () => {
    if (!workspaces || workspaces.length === 0) {
      toast.error('No workspace available'); return
    }
    if (workspaces.length === 1) {
      doCreateDoc(workspaces[0].id); return
    }
    setShowWsPicker(v => !v)
  }

  const handleChangeWorkspace = async (newWsId) => {
    if (!docId || !currentDoc || newWsId === currentDoc.workspace_id) return
    try {
      await updateDoc(docId, { workspace_id: newWsId })
      setCurrentDoc(prev => ({ ...prev, workspace_id: newWsId }))
    } catch (err) {
      toast.error(err.message || 'Failed to move document')
    }
  }

  const handleSave = async (updates) => {
    lastSaveRef.current = Date.now()
    await updateDoc(docId, updates)
    setCurrentDoc(prev => ({ ...prev, ...updates }))
  }

  const handleReloadContent = async () => {
    setRemoteUpdateAvailable(false)
    setDocLoading(true)
    try {
      const fresh = await fetchDocContent(docId)
      setCurrentDoc(fresh)
    } catch (err) {
      toast.error(err.message || 'Failed to reload document')
    } finally {
      setDocLoading(false)
    }
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

  const handlePin = async (doc, e) => {
    e.stopPropagation()
    try {
      await pinDoc(doc.id, !doc.pinned)
    } catch (err) {
      toast.error(err.message || 'Failed to update pin')
    }
  }

  const handlePreviewDoc = async (id) => {
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
  }

  const q = search.trim().toLowerCase()
  const filtered = q ? docs.filter(d => (d.title || '').toLowerCase().includes(q)) : docs
  const grouped  = workspaces
    .map(ws => ({
      ws,
      docs: filtered
        .filter(d => d.workspace_id === ws.id)
        .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    }))
    .filter(g => g.docs.length > 0)
  const orphaned = filtered.filter(d => !workspaces.find(w => w.id === d.workspace_id))

  const wsMap = Object.fromEntries((workspaces || []).map(w => [w.id, w]))
  const mobileGroups = [
    { key: 'pinned', label: 'Pinned', docs: filtered.filter(d => d.pinned) },
    { key: 'recent', label: 'Recent', docs: filtered.filter(d => !d.pinned) },
  ].filter(g => g.docs.length > 0)

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} onShowShortcuts={() => {}} onProfileClick={() => setShowSettings(true)} />

      <div className="writes-shell">
        {/* ── Mobile appbar ───────────────────────────────────── */}
        <div className="mobile-appbar">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(prev => !prev)} aria-label="Toggle sidebar">
            <List size={22} aria-hidden="true" />
          </button>
          <div className="mobile-appbar-title">
            <div className="mobile-appbar-ws"><span>Writes</span></div>
            <div className="mobile-appbar-sub">{currentWorkspace?.name ?? 'My Workspace'}</div>
          </div>
          <BellButton />
        </div>

        {/* ── Page header ─────────────────────────────────────── */}
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <NotePencil size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Writes</span>
          </div>
          <div className="board-header-right">
            <PageHint text="A lightweight document editor for notes, specs, or anything you need to write. Documents are saved per workspace." />
          </div>
        </div>

        <main className={`writes-main${docId ? ' writes-main--doc-open' : ''}`}>
          {/* ── Left panel ────────────────────────────────────── */}
          <div className="wr-list">
            <h2 className="wr-mobile-title">Writes</h2>
            <div className="wr-list-head">
              <div className="wr-search">
                <i>
                  <MagnifyingGlass size={13} aria-hidden="true" />
                </i>
                <input
                  placeholder="Search notes…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label="Search documents"
                />
              </div>
              <div className="wr-new-wrap" ref={wsPickerRef}>
                <button className="wr-new" onClick={handleNew} aria-label="New document">
                  + New note
                </button>
                {showWsPicker && (
                  <div className="wr-ws-picker" role="listbox" aria-label="Select workspace">
                    <div className="wr-ws-picker-label">Create in…</div>
                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        className="wr-ws-picker-item"
                        role="option"
                        onClick={() => { setShowWsPicker(false); doCreateDoc(ws.id) }}
                      >
                        {ws.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="wr-notes">
              {loading ? (
                <p className="writes-list-empty">Loading…</p>
              ) : docs.length === 0 ? (
                <p className="writes-list-empty">No documents yet.</p>
              ) : filtered.length === 0 ? (
                <p className="writes-list-empty">No matches for "{search}".</p>
              ) : isMobile ? (
                mobileGroups.map(({ key, label, docs: grpDocs }) => (
                  <div key={key} className="wr-ws-group">
                    <div className="wr-sec">{label}</div>
                    {grpDocs.map(doc => (
                      <DocItem
                        key={doc.id}
                        doc={doc}
                        docId={docId}
                        wsMap={wsMap}
                        onNavigate={handlePreviewDoc}
                        onPin={handlePin}
                      />
                    ))}
                  </div>
                ))
              ) : (
                <>
                  {grouped.map(({ ws, docs: wsDocs }) => (
                    <div key={ws.id} className="wr-ws-group">
                      <div className="wr-ws-header">
                        <span className="wr-ws-header-dot" style={{ background: ws.color ?? 'var(--accent)' }} aria-hidden="true" />
                        <span className="wr-ws-header-name">{ws.name}</span>
                      </div>
                      {wsDocs.map(doc => (
                        <DocItem
                          key={doc.id}
                          doc={doc}
                          docId={docId}
                          wsMap={wsMap}
                            onNavigate={id => navigate('/writes/' + id)}
                          onPin={handlePin}
                        />
                      ))}
                    </div>
                  ))}
                  {orphaned.length > 0 && (
                    <div>
                      <div className="wr-sec">Other</div>
                      {orphaned.map(doc => (
                        <DocItem
                          key={doc.id}
                          doc={doc}
                          docId={docId}
                          wsMap={wsMap}
                            onNavigate={id => navigate('/writes/' + id)}
                          onPin={handlePin}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile FAB */}
            <div className="wr-fab-wrap" ref={fabRef}>
              <button className="wr-fab" onClick={handleNew} aria-label="New note">
                <Plus size={26} weight="bold" aria-hidden="true" />
              </button>
              {showWsPicker && (
                <div className="wr-ws-picker wr-ws-picker--fab" role="listbox" aria-label="Select workspace">
                  <div className="wr-ws-picker-label">Create in…</div>
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      className="wr-ws-picker-item"
                      role="option"
                      onClick={() => { setShowWsPicker(false); doCreateDoc(ws.id) }}
                    >
                      {ws.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Editor area ───────────────────────────────────── */}
          <div className="writes-editor-area">
            <button className="wr-mobile-back" onClick={() => navigate('/writes')} aria-label="Back to list">
              <ArrowLeft size={18} aria-hidden="true" />
              <span>Writes</span>
            </button>
            {docLoading ? (
              <div className="writes-editor-loading">Loading…</div>
            ) : currentDoc ? (
              <WritesEditor
                key={currentDoc.id}
                doc={currentDoc}
                onSave={handleSave}
                onDelete={handleDelete}
                onChangeWorkspace={handleChangeWorkspace}
                remoteUpdateAvailable={remoteUpdateAvailable}
                onReloadContent={handleReloadContent}
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

      <Suspense fallback={null}>
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </Suspense>

      {isMobile && previewDoc && (
        <DocPreviewSheet
          doc={previewDoc}
          wsMap={wsMap}
          loading={previewLoading}
          onEdit={() => { setPreviewDoc(null); navigate('/writes/' + previewDoc.id) }}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  )
}
