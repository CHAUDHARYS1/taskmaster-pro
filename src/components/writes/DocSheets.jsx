import { useEffect, useRef, useState } from 'react'
import { PencilSimple, X } from '@phosphor-icons/react'
import { fmtDate } from '../../utils/format'
import WritesEditor from './WritesEditor'

export function timeAgo(dateStr) {
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

export function DocPreviewSheet({ doc, wsLabel, loading, onEdit, onClose }) {
  const [expanded,   setExpanded]   = useState(false)
  const [liveHeight, setLiveHeight] = useState(null)
  const sheetRef    = useRef(null)
  const handleRef   = useRef(null)
  const expandedRef = useRef(false)
  const drag        = useRef(null)

  useEffect(() => { expandedRef.current = expanded }, [expanded])

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const onStart = (e) => {
      const t = e.touches[0]
      drag.current = {
        startY: t.clientY,
        startH: sheetRef.current?.offsetHeight ?? window.innerHeight * 0.5,
        lastY:  t.clientY,
        lastT:  Date.now(),
      }
    }
    const onMove = (e) => {
      e.preventDefault()
      if (!drag.current) return
      const t = e.touches[0]
      const delta = drag.current.startY - t.clientY
      const newH = Math.max(120, Math.min(window.innerHeight, drag.current.startH + delta))
      drag.current.lastY = t.clientY
      drag.current.lastT = Date.now()
      setLiveHeight(newH)
    }
    const onEnd = (e) => {
      if (!drag.current) return
      const endY    = e.changedTouches[0].clientY
      const elapsed = Date.now() - drag.current.lastT
      const velocity = elapsed > 0 ? (drag.current.lastY - endY) / elapsed : 0
      const currentH = sheetRef.current?.offsetHeight ?? drag.current.startH
      drag.current = null
      setLiveHeight(null)
      if (velocity > 0.4 || currentH > window.innerHeight * 0.65) {
        setExpanded(true)
      } else if (velocity < -0.4 || currentH < window.innerHeight * 0.3) {
        expandedRef.current ? setExpanded(false) : onClose()
      }
    }

    handle.addEventListener('touchstart', onStart, { passive: true })
    handle.addEventListener('touchmove',  onMove,  { passive: false })
    handle.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      handle.removeEventListener('touchstart', onStart)
      handle.removeEventListener('touchmove',  onMove)
      handle.removeEventListener('touchend',   onEnd)
    }
  }, [onClose])

  const height     = liveHeight != null ? `${liveHeight}px` : expanded ? '100dvh' : '50dvh'
  const transition = liveHeight != null ? 'none' : 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <>
      <div className="doc-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="doc-sheet"
        style={{ height, transition }}
        role="dialog" aria-modal="true" aria-label={doc.title || 'Untitled'}
      >
        <div ref={handleRef} className="doc-sheet-handle" aria-hidden="true" />
        <div className="doc-sheet-bar">
          <span className="doc-sheet-ws">{wsLabel ?? ''}</span>
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

export function DocEditSheet({ doc, onSave, onDelete, onClose, onChangeWorkspace }) {
  const [liveHeight, setLiveHeight] = useState(null)
  const sheetRef  = useRef(null)
  const handleRef = useRef(null)
  const drag      = useRef(null)

  useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const onStart = (e) => {
      drag.current = {
        startY: e.touches[0].clientY,
        startH: sheetRef.current?.offsetHeight ?? window.innerHeight,
        lastY:  e.touches[0].clientY,
        lastT:  Date.now(),
      }
    }
    const onMove = (e) => {
      e.preventDefault()
      if (!drag.current) return
      const t = e.touches[0]
      const delta = drag.current.startY - t.clientY
      const newH = Math.max(200, Math.min(window.innerHeight, drag.current.startH + delta))
      drag.current.lastY = t.clientY
      drag.current.lastT = Date.now()
      setLiveHeight(newH)
    }
    const onEnd = (e) => {
      if (!drag.current) return
      const endY    = e.changedTouches[0].clientY
      const elapsed = Date.now() - drag.current.lastT
      const velocity = elapsed > 0 ? (drag.current.lastY - endY) / elapsed : 0
      const currentH = sheetRef.current?.offsetHeight ?? drag.current.startH
      drag.current = null
      setLiveHeight(null)
      if (velocity < -0.4 || currentH < window.innerHeight * 0.5) onClose()
    }

    handle.addEventListener('touchstart', onStart, { passive: true })
    handle.addEventListener('touchmove',  onMove,  { passive: false })
    handle.addEventListener('touchend',   onEnd,   { passive: true })
    return () => {
      handle.removeEventListener('touchstart', onStart)
      handle.removeEventListener('touchmove',  onMove)
      handle.removeEventListener('touchend',   onEnd)
    }
  }, [onClose])

  const height     = liveHeight != null ? `${liveHeight}px` : '100dvh'
  const transition = liveHeight != null ? 'none' : 'height 0.3s cubic-bezier(0.32, 0.72, 0, 1)'

  return (
    <>
      <div className="doc-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        className="doc-sheet doc-sheet--edit"
        style={{ height, transition }}
        role="dialog"
        aria-modal="true"
        aria-label={doc.title || 'Untitled'}
      >
        <div ref={handleRef} className="doc-sheet-handle" aria-hidden="true" />
        <WritesEditor
          key={doc.id}
          doc={doc}
          onSave={onSave}
          onDelete={onDelete}
          onChangeWorkspace={onChangeWorkspace}
          inSheet
          onSheetClose={onClose}
        />
      </div>
    </>
  )
}
