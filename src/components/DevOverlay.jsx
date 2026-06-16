import { useEffect, useRef, useState } from 'react'

const BADGE_STYLE = `
  position: absolute;
  top: 0;
  left: 0;
  z-index: 99999;
  font: bold 9px/1 monospace;
  color: #000;
  background: #ff1aff;
  padding: 2px 4px;
  border-radius: 0 0 3px 0;
  pointer-events: none;
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ATTR = 'data-dev-overlay'

function injectLabels() {
  const elements = document.querySelectorAll('[class],[id]')
  elements.forEach(el => {
    if (el.hasAttribute(ATTR)) return
    const tag = el.tagName.toLowerCase()
    // Skip elements that are themselves badges, or purely structural (html/body/head)
    if (['html', 'head', 'body', 'script', 'style', 'link', 'meta'].includes(tag)) return

    const computedPos = window.getComputedStyle(el).position
    if (computedPos === 'static') {
      el.style.setProperty('position', 'relative', 'important')
      el.setAttribute('data-dev-overlay-pos', 'added')
    }

    const badge = document.createElement('span')
    badge.setAttribute(ATTR, '1')

    const id = el.id ? `#${el.id}` : ''
    const classes = el.className && typeof el.className === 'string'
      ? [...el.classList].map(c => `.${c}`).join('')
      : ''
    badge.textContent = `${id}${classes}` || tag
    badge.setAttribute('style', BADGE_STYLE)

    el.insertBefore(badge, el.firstChild)
    el.setAttribute(ATTR, '1')
  })
}

function removeLabels() {
  document.querySelectorAll(`[${ATTR}="1"]`).forEach(el => {
    if (el.tagName.toLowerCase() === 'span' && el.getAttribute(ATTR) === '1' && el.parentElement?.hasAttribute(ATTR)) {
      el.remove()
    }
  })
  document.querySelectorAll(`[${ATTR}]`).forEach(el => {
    el.removeAttribute(ATTR)
    if (el.getAttribute('data-dev-overlay-pos') === 'added') {
      el.style.removeProperty('position')
      el.removeAttribute('data-dev-overlay-pos')
    }
  })
}

export default function DevOverlay() {
  const [active, setActive] = useState(false)
  const activeRef = useRef(false)

  useEffect(() => {
    function handleKey(e) {
      if (e.shiftKey && e.code === 'KeyD') {
        activeRef.current = !activeRef.current
        setActive(activeRef.current)
        if (activeRef.current) {
          injectLabels()
        } else {
          removeLabels()
        }
      }
    }
    // Capture phase: fires before child elements (e.g. Tiptap/ProseMirror) can stop propagation
    window.addEventListener('keydown', handleKey, true)
    return () => {
      window.removeEventListener('keydown', handleKey, true)
      removeLabels()
    }
  }, [])

  if (!active) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 100000,
        background: '#ff1aff',
        color: '#000',
        font: 'bold 11px/1 monospace',
        padding: '4px 8px',
        borderRadius: 4,
        pointerEvents: 'none',
      }}
    >
      DEV OVERLAY ON · Shift+D to toggle
    </div>
  )
}
