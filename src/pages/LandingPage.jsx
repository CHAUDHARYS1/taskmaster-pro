import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

/* ── Mini board data (Job Tracker template) ────────────── */
const COLS = [
  {
    id: 'saved', label: 'Saved', color: '#6366f1',
    cards: [
      { title: 'Stripe — Sr. Designer',  priority: { text: '↑ High',   bg: 'rgba(194,65,12,0.25)',  color: '#f97316' }, tag: { text: 'Remote',    bg: 'rgba(37,99,235,0.25)',   color: '#6ea3fd' } },
      { title: 'Google — UX Lead',       priority: { text: '→ Med',    bg: 'rgba(217,119,6,0.25)',  color: '#fbbf24' }, tag: { text: 'Hybrid',    bg: 'rgba(124,58,237,0.25)', color: '#a78bfa' } },
      { title: 'Vercel — Design Eng.',   priority: { text: '↓ Low',    bg: 'rgba(21,128,61,0.25)',  color: '#4ade80'  }, tag: { text: 'Remote',    bg: 'rgba(37,99,235,0.25)',   color: '#6ea3fd' } },
    ],
  },
  {
    id: 'applied', label: 'Applied', color: '#0ea5e9',
    cards: [
      { title: 'Figma — Design Lead',    priority: { text: '!! Urgent', bg: 'rgba(185,28,28,0.25)', color: '#f87171' }, tag: { text: 'Remote',    bg: 'rgba(37,99,235,0.25)',   color: '#6ea3fd' } },
      { title: 'Linear — Product',       priority: { text: '↑ High',    bg: 'rgba(194,65,12,0.25)', color: '#f97316' }, tag: { text: 'Full-time', bg: 'rgba(15,118,110,0.25)', color: '#2dd4bf' } },
    ],
  },
  {
    id: 'progress', label: 'In Progress', color: '#d97706',
    cards: [
      { title: 'Notion — Staff Design',  priority: { text: '!! Urgent', bg: 'rgba(185,28,28,0.25)', color: '#f87171' }, tag: { text: 'Hybrid',    bg: 'rgba(124,58,237,0.25)', color: '#a78bfa' } },
    ],
  },
]

const TEMPLATES = [
  {
    id: 'job',
    icon: '💼',
    name: 'Job Application Tracker',
    desc: 'Track every application from saved listings to closed offers. Built for focused, effective job searching.',
    color: '#6366f1',
    columns: [
      { label: 'Saved',       color: '#6366f1' },
      { label: 'Applied',     color: '#0ea5e9' },
      { label: 'In Progress', color: '#d97706' },
      { label: 'Closed',      color: '#555571' },
    ],
  },
  {
    id: 'freelance',
    icon: '🧾',
    name: 'Freelance Project Tracker',
    desc: 'Manage clients from first contact to final invoice. Stay on top of proposals, delivery, and billing.',
    color: '#22c55e',
    columns: [
      { label: 'Prospect',      color: '#6366f1' },
      { label: 'Proposal Sent', color: '#0ea5e9' },
      { label: 'In Progress',   color: '#d97706' },
      { label: 'Invoiced',      color: '#22c55e' },
    ],
  },
  {
    id: 'blank',
    icon: '✦',
    name: 'Blank Board',
    desc: 'A clean slate. Add your own columns, colors, and workflow from scratch — no constraints.',
    color: '#888899',
    columns: [
      { label: 'To Do',       color: '#6366f1' },
      { label: 'In Progress', color: '#0ea5e9' },
      { label: 'In Review',   color: '#d97706' },
      { label: 'Done',        color: '#22c55e' },
    ],
  },
]

const FEATURES = [
  {
    icon: '⬛',
    iconBg: 'rgba(99,102,241,0.15)',
    title: 'Columns that match your workflow',
    desc: 'Add, remove, rename, and recolor columns to reflect how your work actually moves — not how a template thinks it should. Every workspace is configured independently.',
    wide: true,
    extra: 'colors',
  },
  {
    icon: '◈',
    iconBg: 'rgba(14,165,233,0.15)',
    title: 'Four views, one dataset',
    desc: 'Switch between Board, List, Calendar, and Archive without losing context. Same tasks, different lenses.',
    extra: 'views',
  },
  {
    icon: '☑',
    iconBg: 'rgba(34,197,94,0.15)',
    title: 'Rich task detail',
    desc: 'Every card holds a rich description, checklist, due date, priority, labels, comments, and attachments.',
  },
  {
    icon: '⚡',
    iconBg: 'rgba(245,158,11,0.15)',
    title: 'Real-time collaboration',
    desc: 'See who\'s editing what, live. Changes sync instantly across all workspace members without page reloads.',
  },
]

/* ── Components ─────────────────────────────────────────── */

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`}>
      <Link to="/" className="lp-logo">
        <span className="lp-logo-mark">T</span>
        <span className="lp-logo-name">Taskmaster</span>
      </Link>
      <div className="lp-nav-actions">
        <Link to="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
        <Link to="/login" className="lp-btn lp-btn-primary">Get started</Link>
      </div>
    </nav>
  )
}

function MiniBoard() {
  const [visibleCards, setVisibleCards] = useState(new Set())

  useEffect(() => {
    let idx = 0
    const allCards = COLS.flatMap((col, ci) =>
      col.cards.map((_, ri) => `${ci}-${ri}`)
    )
    const timer = setInterval(() => {
      if (idx >= allCards.length) { clearInterval(timer); return }
      setVisibleCards(prev => new Set([...prev, allCards[idx]]))
      idx++
    }, 120)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="lp-hero-visual">
      <div className="lp-board-wrap">
        <div className="lp-board-titlebar">
          <span className="lp-titlebar-dot" />
          <span className="lp-titlebar-dot" />
          <span className="lp-titlebar-dot" />
          <span className="lp-titlebar-label">Job Application Tracker · My Job Search 2025</span>
        </div>
        <div className="lp-board-cols">
          {COLS.map((col, ci) => (
            <div
              key={col.id}
              className="lp-board-col"
              style={{ '--col-color': col.color }}
            >
              <div className="lp-col-header">
                <span className="lp-col-label">{col.label}</span>
                <span className="lp-col-count">{col.cards.length}</span>
              </div>
              <div className="lp-col-cards">
                {col.cards.map((card, ri) => {
                  const key = `${ci}-${ri}`
                  return (
                    <div
                      key={key}
                      className={`lp-card${visibleCards.has(key) ? ' lp-card-visible' : ''}`}
                      style={{ animationDelay: `${(ci * col.cards.length + ri) * 0.05}s` }}
                    >
                      <div className="lp-card-title">{card.title}</div>
                      <div className="lp-card-meta">
                        <span
                          className="lp-priority"
                          style={{ background: card.priority.bg, color: card.priority.color }}
                        >
                          {card.priority.text}
                        </span>
                        <span
                          className="lp-label"
                          style={{ background: card.tag.bg, color: card.tag.color }}
                        >
                          {card.tag.text}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Hero() {
  return (
    <section className="lp-hero">
      <div className="lp-hero-text">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          3 workspace templates · free to use
        </div>
        <h1>
          One board.<br />
          <em>Every workflow.</em>
        </h1>
        <p className="lp-hero-sub">
          From job hunting to client projects — Taskmaster adapts to how you
          work, not the other way around. Configure your columns, pick your
          colors, and track what matters.
        </p>
        <div className="lp-hero-ctas">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">
            Start for free →
          </Link>
          <Link to="/login" className="lp-btn-outline-lg">
            Sign in
          </Link>
        </div>
        <p className="lp-hero-note">No credit card required.</p>
      </div>
      <MiniBoard />
    </section>
  )
}

function Templates() {
  return (
    <section className="lp-section lp-templates">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">Templates</p>
        <h2 className="lp-section-heading">
          Start with purpose,<br /><em>finish with results.</em>
        </h2>
        <p className="lp-section-sub">
          Choose a template when creating your workspace. Every column, label,
          and color is pre-configured — then make it yours.
        </p>
        <div className="lp-template-grid">
          {TEMPLATES.map(t => (
            <div
              key={t.id}
              className="lp-template-card"
              style={{ '--t-color': t.color }}
            >
              <div className="lp-template-icon">{t.icon}</div>
              <div className="lp-template-name">{t.name}</div>
              <p className="lp-template-desc">{t.desc}</p>
              <div className="lp-template-cols">
                {t.columns.map(col => (
                  <span
                    key={col.label}
                    className="lp-template-col-pill"
                    style={{ background: `${col.color}28` }}
                  >
                    {col.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="lp-section">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">Features</p>
        <h2 className="lp-section-heading">
          Built for how work<br /><em>actually happens.</em>
        </h2>
        <p className="lp-section-sub">
          Not a stripped-down todo list. Not an enterprise maze. Just the right
          features, thoughtfully put together.
        </p>
        <div className="lp-features-grid">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className={`lp-feature${f.wide ? ' lp-feature--wide' : ''}`}
            >
              <div className="lp-feature-icon" style={{ background: f.iconBg }}>
                {f.icon}
              </div>
              <div className="lp-feature-title">{f.title}</div>
              <p className="lp-feature-desc">{f.desc}</p>

              {f.extra === 'views' && (
                <div className="lp-views-strip">
                  {['⊞ Board', '≡ List', '◫ Calendar', '⊙ Archive'].map(v => (
                    <span key={v} className="lp-view-chip">{v}</span>
                  ))}
                </div>
              )}

              {f.extra === 'colors' && (
                <div className="lp-color-swatch-row">
                  {['#6366f1','#0ea5e9','#22c55e','#d97706','#ef4444','#ec4899','#7c3aed','#555555','#0f766e','#f97316'].map(c => (
                    <span
                      key={c}
                      className="lp-swatch"
                      style={{ background: c }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BottomCTA() {
  return (
    <section className="lp-cta">
      <h2>
        Your work, your board.<br />
        <em>Finally.</em>
      </h2>
      <p>Get started in seconds. No setup required.</p>
      <div className="lp-cta-actions">
        <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">
          Create your workspace →
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="lp-footer">
      <span className="lp-footer-copy">© {new Date().getFullYear()} Taskmaster</span>
      <div className="lp-footer-links">
        <Link to="/login">Sign in</Link>
        <Link to="/login">Get started</Link>
      </div>
    </footer>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => {
    document.title = 'Taskmaster — The task board that works exactly like you do'
    return () => { document.title = 'Taskmaster' }
  }, [])

  return (
    <div className="lp">
      <Nav />
      <Hero />
      <Templates />
      <Features />
      <BottomCTA />
      <Footer />
    </div>
  )
}
