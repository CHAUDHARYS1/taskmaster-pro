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
    const startX     = e.clientX
    const startWidth = widthRef.current

    document.body.style.userSelect   = 'none'
    document.body.style.cursor       = 'col-resize'

    const onMove = (ev) => {
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (startX - ev.clientX)))
      setWidth(next)
    }

    const onUp = () => {
      document.body.style.userSelect = ''
      document.body.style.cursor     = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
      localStorage.setItem(STORAGE_KEY, String(widthRef.current))
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }, [])

  return { width, startResize }
}
