import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './welcome-overlay.css'

function dayPart() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

/* CSS injected into <head> to hide then settle real surface elements */
const SETTLE_CSS = `
body.tm-armed .board-header,
body.tm-armed .mobile-appbar,
body.tm-armed .icon-bar,
body.tm-armed .mob-view-bar,
body.tm-armed .filter-bar,
body.tm-armed .mobile-lane-chip,
body.tm-armed .task-card,
body.tm-armed .mobile-fab { opacity: 0; }

.tm-go { animation: tmSettle .85s cubic-bezier(.22,1,.36,1) both; }
@keyframes tmSettle {
  from { opacity: 0; transform: translateY(22px) scale(.965); }
  to   { opacity: 1; transform: none; }
}
.tm-side { animation: tmSide .8s cubic-bezier(.22,1,.36,1) both; }
@keyframes tmSide {
  from { opacity: 0; transform: translateX(-18px); }
  to   { opacity: 1; transform: none; }
}
`

const SETTLE_SEL = [
  '.board-header', '.mobile-appbar', '.icon-bar', '.mob-view-bar',
  '.filter-bar', '.mobile-lane-chip', '.task-card', '.mobile-fab',
].join(',')

function armSurface() {
  const targets = document.querySelectorAll(SETTLE_SEL)
  if (targets.length < 2) return false
  if (!document.getElementById('tm-settle-style')) {
    const s = document.createElement('style')
    s.id = 'tm-settle-style'
    s.textContent = SETTLE_CSS
    document.head.appendChild(s)
  }
  document.body.classList.add('tm-armed')
  return true
}

function triggerSettle(reduced) {
  const side = document.querySelector('.sidebar')
  const els  = [...document.querySelectorAll(SETTLE_SEL)].sort((a, b) => {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect()
    return (ra.top - rb.top) || (ra.left - rb.left)
  })
  if (reduced) {
    document.body.classList.remove('tm-armed')
    return
  }
  if (side) {
    side.style.animationDelay = '0ms'
    side.classList.add('tm-side')
  }
  els.forEach((el, i) => {
    el.style.animationDelay = (90 + i * 52) + 'ms'
    el.classList.add('tm-go')
  })
}

function cleanupSettle() {
  document.body.classList.remove('tm-armed')
  const s = document.getElementById('tm-settle-style')
  if (s) s.remove()
  document.querySelectorAll('.tm-go, .tm-side').forEach(el => {
    el.classList.remove('tm-go', 'tm-side')
    el.style.animationDelay = ''
  })
}

export default function WelcomeOverlay({ firstName }) {
  const { justSignedIn, consumeJustSignedIn } = useAuth()

  /* Capture the flag at first mount; context value survives re-renders */
  const [shouldShow] = useState(() => justSignedIn)

  const [phase, setPhase] = useState('enter')
  const phaseRef = useRef('enter')
  const timers   = useRef([])
  const reduced  = useRef(
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current

  function setP(p) { phaseRef.current = p; setPhase(p) }

  useEffect(() => {
    if (!shouldShow) return
    consumeJustSignedIn()

    const push = (ms, fn) => { timers.current.push(setTimeout(fn, ms)) }
    const clear = () => { timers.current.forEach(clearTimeout); timers.current = [] }

    const reveal = () => {
      if (phaseRef.current !== 'enter') return
      setP('lifting')
      push(650, () => {
        triggerSettle(reduced)
        setP('revealing')
      })
      push(1650, () => {
        setP('gone')
        cleanupSettle()
      })
    }

    let raf
    const startedAt = performance.now()
    const tick = () => {
      const armed = armSurface()
      if (armed || performance.now() - startedAt > 4000) {
        push(reduced ? 600 : 3500, reveal)
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clear()
      cleanupSettle()
    }
  }, [shouldShow]) // eslint-disable-line react-hooks/exhaustive-deps

  const skip = () => {
    if (phaseRef.current !== 'enter') return
    timers.current.forEach(clearTimeout)
    timers.current = []
    armSurface()
    setP('lifting')
    timers.current.push(setTimeout(() => {
      triggerSettle(reduced)
      setP('revealing')
    }, 350))
    timers.current.push(setTimeout(() => {
      setP('gone')
      cleanupSettle()
    }, 1050))
  }

  if (!shouldShow) return null

  return (
    <div
      className={[
        'wm',
        (phase === 'lifting' || phase === 'revealing' || phase === 'gone') && 'lifting',
        (phase === 'revealing' || phase === 'gone') && 'revealing',
        phase === 'gone' && 'is-gone',
      ].filter(Boolean).join(' ')}
      onClick={skip}
      role="presentation"
      aria-hidden="true"
    >
      <div className="wm-paper" />
      <div className="wm-glow" />
      <div className="wm-glow b2" />

      <div className="wm-content">
        <span className="wm-eyebrow">
          <span className="wm-tick" />
          Good {dayPart()}
        </span>
        <h1 className="wm-head">
          <span className="l1">Welcome back,</span>
          {firstName && <span className="name">{firstName}.</span>}
        </h1>
        <p className="wm-sub">Your workspace is ready.</p>
      </div>

      <span className="wm-skip">Tap to skip</span>
    </div>
  )
}
