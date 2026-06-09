import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_WIDTH     = 300
const MAX_WIDTH     = 860
const DEFAULT_WIDTH = 420
const STORAGE_KEY   = 'tm_panel_width'

export function usePanelResize() {
  const [width, setWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10)
    return (!isNaN(saved) && saved >= MIN_WIDTH && saved <= MAX_WIDTH) ? saved : DEFAULT_WIDTH
  })

  const widthRef = useRef(width)
  useEffect(() => { widthRef.current = width }, [width])

  const startResize = useCallback((e) => {
    e.preventDefault()
    const isTouch    = e.type === 'touchstart'
    const startX     = isTouch ? e.touches[0].clientX : e.clientX
    const startWidth = widthRef.current

    document.body.style.userSelect = 'none'
    document.body.style.cursor     = 'col-resize'

    const onMove = (ev) => {
      if (ev.cancelable) ev.preventDefault()
      const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (startX - clientX)))
      setWidth(next)
    }

    const onEnd = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor     = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onEnd)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend',  onEnd)
      localStorage.setItem(STORAGE_KEY, String(widthRef.current))
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onEnd)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend',  onEnd)
  }, [])

  return { width, startResize }
}
