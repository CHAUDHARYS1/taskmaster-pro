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

      // Build a normalized combo: 'ctrl+n', 'ctrl+shift+a', 'Escape', etc.
      // Single-character keys are lowercased so Shift doesn't break combos like ctrl+shift+a.
      const mods = []
      if (e.ctrlKey || e.metaKey) mods.push('ctrl')
      if (e.shiftKey) mods.push('shift')
      const key   = e.key.length === 1 ? e.key.toLowerCase() : e.key
      const combo = mods.length ? `${mods.join('+')}+${key}` : key

      // Try full combo first, then bare key (handles '?', '/', special keys)
      const fn = mapRef.current[combo] ?? mapRef.current[key]
      if (!fn) return
      // Always honour Escape; skip all other shortcuts while typing
      if (isEditing && e.key !== 'Escape') return
      fn(e)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
