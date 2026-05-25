import { useEffect, useRef } from 'react'

export function useKeyboardShortcuts(map) {
  const mapRef = useRef(map)
  mapRef.current = map

  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName
      const isEditing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) ||
        document.activeElement?.isContentEditable

      const fn = mapRef.current[e.key]
      if (!fn) return
      // Always honour Escape; skip all other shortcuts while typing
      if (isEditing && e.key !== 'Escape') return
      fn(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
