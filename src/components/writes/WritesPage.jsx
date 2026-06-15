import { lazy, Suspense, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  List, NotePencil, BookOpen, Star, Target, Briefcase,
  FileText, MagnifyingGlass, PushPin, ArrowLeft,
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

const NOTE_ICONS = [NotePencil, BookOpen, Star, Target, Briefcase, FileText]

function NoteIcon({ index, size = 15 }) {
  const Icon = NOTE_ICONS[index % NOTE_ICONS.length]
  return <Icon size={size} aria-hidden="true" />
}

export default function WritesPage() {
  const { docId }    = useParams()
  const navigate     = useNavigate()
  const { currentWorkspace, workspaces } = useWorkspace()
  const { toast }    = useToast()
  const { docs, loading, createDoc, updateDoc, deleteDoc, fetchDocContent, pinDoc } = useDocuments(null)

  const [currentDoc,  setCurrentDoc]  = useState(null)
  const [search,      setSearch]      = useState('')
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [docLoading,  setDocLoading]  = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    if (!docId) { setCurrentDoc(null); return }
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

  const handleNew = async () => {
    const wsId = currentWorkspace?.id ?? workspaces?.[0]?.id
    if (!wsId) { toast.error('Select a workspace to create a document'); return }
    try {
      const doc = await createDoc(wsId)
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

  const handlePin = async (doc, e) => {
    e.stopPropagation()
    try {
      await pinDoc(doc.id, !doc.pinned)
    } catch (err) {
      toast.error(err.message || 'Failed to update pin')
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = q ? docs.filter(d => (d.title || '').toLowerCase().includes(q)) : docs
  const pinned   = filtered.filter(d => d.pinned)
  const recent   = filtered.filter(d => !d.pinned)

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
              <button className="wr-new" onClick={handleNew} aria-label="New document">
                + New
              </button>
            </div>

            <div className="wr-notes">
              {loading ? (
                <p className="writes-list-empty">Loading…</p>
              ) : docs.length === 0 ? (
                <p className="writes-list-empty">No documents yet.</p>
              ) : filtered.length === 0 ? (
                <p className="writes-list-empty">No matches for "{search}".</p>
              ) : (
                <>
                  {pinned.length > 0 && (
                    <>
                      <div className="wr-sec">
                        <PushPin size={11} weight="fill" aria-hidden="true" />
                        Pinned
                      </div>
                      {pinned.map((doc, i) => {
                        const ws = workspaces.find(w => w.id === doc.workspace_id)
                        return (
                          <button
                            key={doc.id}
                            className={`wr-note${docId === doc.id ? ' on' : ''}`}
                            onClick={() => navigate('/writes/' + doc.id)}
                          >
                            <div className="wr-note-top">
                              <span className="wr-note-ico">
                                <NoteIcon index={i} />
                              </span>
                              <span className="wr-note-title">{doc.title || 'Untitled'}</span>
                              <button
                                className="wr-pin-ico"
                                onClick={e => handlePin(doc, e)}
                                aria-label="Unpin document"
                              >
                                <PushPin size={13} weight="fill" aria-hidden="true" />
                              </button>
                            </div>
                            {doc.preview && <p className="wr-note-snip">{doc.preview}</p>}
                            <div className="wr-note-meta">
                              {ws && (
                                <span className="wr-note-ws">
                                  <span className="dot" aria-hidden="true" />
                                  {ws.name}
                                </span>
                              )}
                              {ws && <span>·</span>}
                              <span>{fmtDate(doc.updated_at)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )}

                  {recent.length > 0 && (
                    <>
                      <div className="wr-sec">Recent</div>
                      {recent.map((doc, i) => {
                        const ws = workspaces.find(w => w.id === doc.workspace_id)
                        const globalIdx = pinned.length + i
                        return (
                          <button
                            key={doc.id}
                            className={`wr-note${docId === doc.id ? ' on' : ''}`}
                            onClick={() => navigate('/writes/' + doc.id)}
                          >
                            <div className="wr-note-top">
                              <span className="wr-note-ico">
                                <NoteIcon index={globalIdx} />
                              </span>
                              <span className="wr-note-title">{doc.title || 'Untitled'}</span>
                              <button
                                className="wr-pin-ico"
                                style={{ opacity: 0.3 }}
                                onClick={e => handlePin(doc, e)}
                                aria-label="Pin document"
                              >
                                <PushPin size={13} aria-hidden="true" />
                              </button>
                            </div>
                            {doc.preview && <p className="wr-note-snip">{doc.preview}</p>}
                            <div className="wr-note-meta">
                              {ws && (
                                <span className="wr-note-ws">
                                  <span className="dot" aria-hidden="true" />
                                  {ws.name}
                                </span>
                              )}
                              {ws && <span>·</span>}
                              <span>{fmtDate(doc.updated_at)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </>
                  )}
                </>
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
    </div>
  )
}
