import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

/* ─── Logo ─────────────────────────────────────────────── */
function LogoSVG({ height = 26 }) {
  const w = height * (300 / 52)
  return (
    <svg viewBox="0 0 300 52" width={w} height={height} role="img" aria-label="Taskmaster Pro">
      <g transform="translate(0,4)">
        <rect width="44" height="44" rx="11.4" fill="#2563EB" />
        <path d="M12.3 22.9 L19.4 29.9 L32.6 15" fill="none" stroke="#fff"
          strokeWidth="5.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <text x="58" y="34" fontFamily="'Plus Jakarta Sans', -apple-system, sans-serif"
        fontSize="27" fontWeight="700" letterSpacing="-0.5" className="lp-logo-wordmark">
        Taskmaster<tspan fill="#2563EB"> Pro</tspan>
      </text>
    </svg>
  )
}

/* ─── Nav ───────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className={`lp-nav${scrolled ? ' lp-nav--scrolled' : ''}`} role="navigation">
      <Link to="/" className="lp-logo" aria-label="Taskmaster Pro home"><LogoSVG /></Link>
      <div className="lp-nav-links">
        <Link to="/about" className="lp-nav-link">About</Link>
      </div>
      <div className="lp-nav-actions">
        <Link to="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
        <Link to="/login" className="lp-btn lp-btn-primary">Get started</Link>
      </div>
    </nav>
  )
}

/* ─── Board mockup data ─────────────────────────────────── */
const TEMPLATE_BOARDS = {
  job: {
    label: 'Job Application Tracker',
    cols: [
      { label: 'Saved', color: '#6366f1', cards: [
        { t: 'Stripe — Sr. Designer',   pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Remote'    } },
        { t: 'Google — UX Lead',        pri: { c: '#fbbf24', bg: 'rgba(251,191,36,.18)', s: '→ Med'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Hybrid'    } },
        { t: 'Vercel — Design Eng.',    pri: { c: '#4ade80', bg: 'rgba(74,222,128,.18)', s: '↓ Low'    }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Remote'    } },
      ]},
      { label: 'Applied', color: '#0ea5e9', cards: [
        { t: 'Figma — Design Lead',     pri: { c: '#f87171', bg: 'rgba(248,113,113,.18)', s: '!! Urgent' }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Remote'    } },
        { t: 'Linear — Product',        pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#2dd4bf', bg: 'rgba(45,212,191,.15)', s: 'Full-time' } },
      ]},
      { label: 'In Progress', color: '#d97706', cards: [
        { t: 'Notion — Staff Design',   pri: { c: '#f87171', bg: 'rgba(248,113,113,.18)', s: '!! Urgent' }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Hybrid'    } },
      ]},
      { label: 'Closed', color: '#6b7280', cards: [
        { t: 'Apple — HIG Designer',    pri: { c: '#4ade80', bg: 'rgba(74,222,128,.18)', s: '↓ Low'    }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Remote'    } },
      ]},
    ],
  },
  freelance: {
    label: 'Freelance Project Tracker',
    cols: [
      { label: 'Prospect', color: '#6366f1', cards: [
        { t: 'Aria Health — Brand',     pri: { c: '#fbbf24', bg: 'rgba(251,191,36,.18)', s: '→ Med'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
        { t: 'Dune Studio — Web',       pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Dev'       } },
      ]},
      { label: 'Proposal Sent', color: '#0ea5e9', cards: [
        { t: 'Opal Foods — Identity',   pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
        { t: 'Moss Co. — Dashboard',    pri: { c: '#fbbf24', bg: 'rgba(251,191,36,.18)', s: '→ Med'    }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Dev'       } },
      ]},
      { label: 'In Progress', color: '#d97706', cards: [
        { t: 'Crest Media — Site',      pri: { c: '#f87171', bg: 'rgba(248,113,113,.18)', s: '!! Urgent' }, tag: { c: '#2dd4bf', bg: 'rgba(45,212,191,.15)', s: 'Retainer' } },
      ]},
      { label: 'Invoiced', color: '#22c55e', cards: [
        { t: 'Lune App — Mobile UI',    pri: { c: '#4ade80', bg: 'rgba(74,222,128,.18)', s: '↓ Low'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
      ]},
    ],
  },
  blank: {
    label: 'Blank Board',
    cols: [
      { label: 'To Do', color: '#6366f1', cards: [
        { t: 'Q3 design audit',         pri: { c: '#fbbf24', bg: 'rgba(251,191,36,.18)', s: '→ Med'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
        { t: 'Update component lib',    pri: { c: '#4ade80', bg: 'rgba(74,222,128,.18)', s: '↓ Low'    }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Dev'       } },
        { t: 'Migrate auth to v2',      pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Dev'       } },
      ]},
      { label: 'In Progress', color: '#0ea5e9', cards: [
        { t: 'Dashboard redesign',      pri: { c: '#f87171', bg: 'rgba(248,113,113,.18)', s: '!! Urgent' }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
        { t: 'API rate limiting',       pri: { c: '#f97316', bg: 'rgba(249,115,22,.18)', s: '↑ High'   }, tag: { c: '#6ea3fd', bg: 'rgba(37,99,235,.15)', s: 'Dev'       } },
      ]},
      { label: 'In Review', color: '#d97706', cards: [
        { t: 'Onboarding flow',         pri: { c: '#fbbf24', bg: 'rgba(251,191,36,.18)', s: '→ Med'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
      ]},
      { label: 'Done', color: '#22c55e', cards: [
        { t: 'Dark mode tokens',        pri: { c: '#4ade80', bg: 'rgba(74,222,128,.18)', s: '↓ Low'    }, tag: { c: '#a78bfa', bg: 'rgba(124,58,237,.15)', s: 'Design'    } },
      ]},
    ],
  },
}

function MiniBoard({ board, animate = true }) {
  const [visible, setVisible] = useState(new Set())
  const key = board.label

  useEffect(() => {
    setVisible(new Set())
    if (!animate) return
    const all = board.cols.flatMap((c, ci) => c.cards.map((_, ri) => `${ci}-${ri}`))
    let i = 0
    const t = setInterval(() => {
      if (i >= all.length) { clearInterval(t); return }
      setVisible(p => new Set([...p, all[i++]]))
    }, 80)
    return () => clearInterval(t)
  }, [key])

  return (
    <div className="lp-board-wrap">
      <div className="lp-board-titlebar">
        <span className="lp-titlebar-dot" /><span className="lp-titlebar-dot" /><span className="lp-titlebar-dot" />
        <span className="lp-titlebar-label">{board.label}</span>
      </div>
      <div className="lp-board-cols">
        {board.cols.map((col, ci) => (
          <div key={col.label} className="lp-board-col" style={{ '--col-color': col.color }}>
            <div className="lp-col-header">
              <span className="lp-col-label">{col.label}</span>
              <span className="lp-col-count">{col.cards.length}</span>
            </div>
            <div className="lp-col-cards">
              {col.cards.map((card, ri) => {
                const id = `${ci}-${ri}`
                return (
                  <div key={id} className={`lp-card${visible.has(id) ? ' lp-card-visible' : ''}`}>
                    <div className="lp-card-title">{card.t}</div>
                    <div className="lp-card-meta">
                      <span className="lp-priority" style={{ background: card.pri.bg, color: card.pri.c }}>{card.pri.s}</span>
                      <span className="lp-label"   style={{ background: card.tag.bg, color: card.tag.c }}>{card.tag.s}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="lp-hero" id="main-content">
      <div className="lp-hero-text">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          3 workspace templates — free to use
        </div>
        <h1>One board.<br /><em>Every workflow.</em></h1>
        <p className="lp-hero-sub">
          From job hunting to client projects — Taskmaster adapts to how you
          work, not the other way around. Configure your columns, pick your
          colors, and track what matters.
        </p>
        <div className="lp-hero-ctas">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Start for free →</Link>
          <Link to="/login" className="lp-btn-outline-lg">Sign in</Link>
        </div>
        <p className="lp-hero-note">No credit card required.</p>
      </div>
      <div className="lp-hero-visual">
        <MiniBoard board={TEMPLATE_BOARDS.job} />
      </div>
    </section>
  )
}

/* ─── Stats strip ───────────────────────────────────────── */
function Stats() {
  const stats = [
    { n: '3', label: 'Workspace templates' },
    { n: '4', label: 'Board views' },
    { n: '∞', label: 'Custom columns' },
    { n: '100%', label: 'Yours to configure' },
  ]
  return (
    <div className="lp-stats-strip">
      {stats.map((s, i) => (
        <div key={i} className="lp-stat">
          <span className="lp-stat-n">{s.n}</span>
          <span className="lp-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ─── Template showcase ─────────────────────────────────── */
const TEMPLATE_TABS = [
  { id: 'job',      label: '💼  Job Tracker',      desc: 'Track every application from saved listings to offer. Purpose-built for focused, effective job searching.', color: '#6366f1' },
  { id: 'freelance',label: '🧾  Freelance Tracker', desc: 'Manage clients from first contact to final invoice. Stay on top of proposals, delivery, and payment.', color: '#22c55e' },
  { id: 'blank',    label: '✦  Blank Board',        desc: 'A clean slate. Add your own columns, colors, and workflow from scratch — no constraints, no opinions.', color: '#2563EB' },
]

function Templates() {
  const [active, setActive] = useState('job')
  const board = TEMPLATE_BOARDS[active]
  const tab   = TEMPLATE_TABS.find(t => t.id === active)

  return (
    <section className="lp-section lp-templates">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">Templates</p>
        <h2 className="lp-section-heading">Start with purpose,<br /><em>make it yours.</em></h2>
        <p className="lp-section-sub">
          Pick a template when creating your workspace. Every column, label,
          and color is pre-configured — then adjust anything you like.
        </p>

        <div className="lp-template-tabs">
          {TEMPLATE_TABS.map(t => (
            <button
              key={t.id}
              className={`lp-template-tab${active === t.id ? ' lp-template-tab--active' : ''}`}
              onClick={() => setActive(t.id)}
              style={active === t.id ? { '--tab-color': t.color } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="lp-template-showcase">
          <div className="lp-template-showcase-info">
            <p className="lp-template-showcase-desc">{tab.desc}</p>
            <div className="lp-template-cols-preview">
              {board.cols.map(c => (
                <span key={c.label} className="lp-template-col-pill"
                  style={{ background: `${c.color}18`, color: c.color }}>
                  {c.label}
                </span>
              ))}
            </div>
            <Link to="/login" className="lp-btn lp-btn-primary" style={{ marginTop: 24, alignSelf: 'flex-start' }}>
              Use this template →
            </Link>
          </div>
          <div className="lp-template-showcase-board">
            <MiniBoard board={board} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Features bento ────────────────────────────────────── */
function Features() {
  return (
    <section className="lp-section">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">Built right</p>
        <h2 className="lp-section-heading">The features that<br /><em>actually matter.</em></h2>
        <p className="lp-section-sub">
          Not a stripped-down todo list, not an enterprise maze. Just the right
          features, thoughtfully put together.
        </p>

        <div className="lp-bento">
          {/* Wide card: columns */}
          <div className="lp-bento-card lp-bento-wide">
            <div className="lp-bento-icon" style={{ background: 'rgba(99,102,241,.1)' }}>⬛</div>
            <h3>Columns you control</h3>
            <p>Add, remove, rename, and recolor columns to reflect how your work actually moves. Every workspace is configured independently.</p>
            <div className="lp-color-swatch-row">
              {['#6366f1','#2563EB','#0ea5e9','#0f766e','#22c55e','#d97706','#ef4444','#ec4899','#7c3aed','#6b7280'].map(c => (
                <span key={c} className="lp-swatch" style={{ background: c }} aria-hidden="true" />
              ))}
            </div>
          </div>

          {/* Views */}
          <div className="lp-bento-card">
            <div className="lp-bento-icon" style={{ background: 'rgba(14,165,233,.1)' }}>◈</div>
            <h3>Four views, one dataset</h3>
            <p>Switch between Board, List, Calendar, and Archive without losing context.</p>
            <div className="lp-views-strip">
              {['⊞ Board','≡ List','◫ Calendar','⊙ Archive'].map(v => (
                <span key={v} className="lp-view-chip">{v}</span>
              ))}
            </div>
          </div>

          {/* Rich task */}
          <div className="lp-bento-card">
            <div className="lp-bento-icon" style={{ background: 'rgba(34,197,94,.1)' }}>☑</div>
            <h3>Rich task detail</h3>
            <p>Every card holds a rich description, checklist, due date, priority, labels, and comments.</p>
            <div className="lp-task-preview">
              <div className="lp-task-preview-row"><span className="lp-task-preview-check lp-task-preview-check--done" />Interview prep</div>
              <div className="lp-task-preview-row"><span className="lp-task-preview-check lp-task-preview-check--done" />Research company</div>
              <div className="lp-task-preview-row"><span className="lp-task-preview-check" />Send thank-you note</div>
            </div>
          </div>

          {/* Real-time */}
          <div className="lp-bento-card lp-bento-accent">
            <div className="lp-bento-icon" style={{ background: 'rgba(255,255,255,.15)' }}>⚡</div>
            <h3>Real-time collaboration</h3>
            <p>See who's editing what, live. Changes sync instantly — no page reloads, no conflicts.</p>
          </div>

          {/* Labels */}
          <div className="lp-bento-card">
            <div className="lp-bento-icon" style={{ background: 'rgba(245,158,11,.1)' }}>⬡</div>
            <h3>Labels &amp; priorities</h3>
            <p>Create workspace-scoped labels. Assign priorities from Low to Urgent. Filter instantly.</p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Testimonials ──────────────────────────────────────── */
function Testimonials() {
  const quotes = [
    { q: "Finally a board that doesn't assume I work like everyone else. I have my job search perfectly tracked — Stripe interview is up next.", name: 'M. Chen', role: 'Product Designer' },
    { q: 'Switched from Notion for client tracking. The freelance template was exactly what I needed, and I customized it in ten minutes.', name: 'J. Okafor', role: 'Independent Consultant' },
    { q: 'The column colors seem like a small thing but they completely changed how I scan my board. I see status at a glance now.', name: 'S. Park', role: 'UX Researcher' },
  ]
  return (
    <section className="lp-section lp-testimonials-section">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">What people say</p>
        <div className="lp-testimonials">
          {quotes.map((q, i) => (
            <blockquote key={i} className="lp-testimonial">
              <p className="lp-testimonial-q">"{q.q}"</p>
              <footer className="lp-testimonial-footer">
                <span className="lp-testimonial-name">{q.name}</span>
                <span className="lp-testimonial-role">{q.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── CTA ───────────────────────────────────────────────── */
function CTA() {
  return (
    <section className="lp-cta">
      <h2>Your work, your board.<br /><em>Finally.</em></h2>
      <p>Get started in seconds. Pick a template, name your workspace, done.</p>
      <div className="lp-cta-actions">
        <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Create your workspace →</Link>
        <Link to="/about" className="lp-btn-outline-lg">About the project</Link>
      </div>
    </section>
  )
}

/* ─── Footer ────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-left">
        <LogoSVG height={20} />
        <span className="lp-footer-credit">Designed and built by SC Design and Consultation</span>
        <span className="lp-footer-copy">© {new Date().getFullYear()} Taskmaster Pro</span>
      </div>
      <div className="lp-footer-links">
        <Link to="/about">About</Link>
        <Link to="/login">Sign in</Link>
        <Link to="/login">Get started</Link>
      </div>
    </footer>
  )
}

/* ─── Page ──────────────────────────────────────────────── */
export default function LandingPage() {
  useEffect(() => {
    document.title = 'Taskmaster Pro — The task board that works exactly like you do'
    return () => { document.title = 'Taskmaster Pro' }
  }, [])
  return (
    <div className="lp">
      <Nav />
      <Hero />
      <Stats />
      <Templates />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
