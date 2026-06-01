import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './about.css'

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
        fontSize="27" fontWeight="700" letterSpacing="-0.5" className="ab-logo-wordmark">
        Taskmaster<tspan fill="#2563EB"> Pro</tspan>
      </text>
    </svg>
  )
}

function Nav() {
  return (
    <nav className="ab-nav" role="navigation">
      <Link to="/" className="ab-logo" aria-label="Taskmaster Pro home"><LogoSVG /></Link>
      <div className="ab-nav-links">
        <Link to="/" className="ab-nav-link">Product</Link>
      </div>
      <div className="ab-nav-actions">
        <Link to="/login" className="ab-btn ab-btn-ghost">Sign in</Link>
        <Link to="/login" className="ab-btn ab-btn-primary">Get started</Link>
      </div>
    </nav>
  )
}

const STACK = [
  { name: 'React 18',    desc: 'Component UI',    color: '#61dafb', bg: 'rgba(97,218,251,.1)'  },
  { name: 'Vite',        desc: 'Build tooling',   color: '#bd34fe', bg: 'rgba(189,52,254,.1)'  },
  { name: 'Supabase',    desc: 'Database + auth', color: '#3ecf8e', bg: 'rgba(62,207,142,.1)'  },
  { name: '@dnd-kit',    desc: 'Drag & drop',     color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
  { name: 'Phosphor',    desc: 'Icon system',     color: '#2563EB', bg: 'rgba(37,99,235,.1)'   },
  { name: 'TipTap',      desc: 'Rich text',       color: '#6366f1', bg: 'rgba(99,102,241,.1)'  },
]

const VALUES = [
  {
    word: 'Beautiful.',
    body: 'Every detail matters — from the 3px column top border to the staggered card animations. Software that looks considered earns trust before a single word is read.',
  },
  {
    word: 'Functional.',
    body: 'Beauty without function is decoration. Every visual choice serves a purpose: column colors reduce scan time, priority badges communicate urgency, checklists make scope visible.',
  },
  {
    word: 'Yours.',
    body: 'The best tool is the one that disappears into your workflow. Taskmaster Pro adapts to you — your column names, your colors, your templates, your pace.',
  },
]

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About — Taskmaster Pro'
    return () => { document.title = 'Taskmaster Pro' }
  }, [])

  return (
    <div className="ab">
      <Nav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="ab-hero" id="main-content">
        <div className="ab-hero-inner">
          <p className="ab-overline">SC Design and Consultation</p>
          <h1 className="ab-hero-h1">
            We build software that works<br />
            <em>the way people think.</em>
          </h1>
          <p className="ab-hero-sub">
            Not the way a spec says they should. Not the way a legacy architecture
            demands. The way the person sitting in front of the screen actually thinks.
          </p>
        </div>
        <div className="ab-hero-rule" aria-hidden="true" />
      </section>

      {/* ── Studio ─────────────────────────────────────────── */}
      <section className="ab-section ab-studio">
        <div className="ab-section-inner ab-two-col">
          <div className="ab-col-left">
            <p className="ab-pull-quote">
              "Good design is invisible. Great software is indistinguishable from thought."
            </p>
          </div>
          <div className="ab-col-right">
            <p className="ab-eyebrow">The studio</p>
            <p className="ab-body">
              SC Design and Consultation is a boutique design and development studio
              focused on building software that is both visually refined and deeply
              functional. We don't believe those things are in tension.
            </p>
            <p className="ab-body">
              We work at the intersection of product design and engineering —
              where the decisions about how something looks and how it works are
              made together, not handed off between disciplines.
            </p>
            <p className="ab-body">
              Taskmaster Pro is our flagship product, and the clearest expression
              of what we believe software can be.
            </p>
          </div>
        </div>
      </section>

      {/* ── Origin ─────────────────────────────────────────── */}
      <section className="ab-section ab-origin">
        <div className="ab-section-inner">
          <div className="ab-origin-card">
            <p className="ab-eyebrow">The origin</p>
            <h2 className="ab-origin-h2">
              It started as an internal tool.<br />
              <em>It became something worth sharing.</em>
            </h2>
            <div className="ab-origin-body">
              <p>
                Taskmaster Pro began as a simple kanban board we built to manage
                our own projects — a plain HTML page with jQuery drag-and-drop
                and a localStorage state model. It did the job. Then it did the
                job well. Then we couldn't imagine working without it.
              </p>
              <p>
                When we rebuilt it in React with a proper backend, real-time
                collaboration, and workspace templates, something clicked. This
                wasn't just a dev tool anymore — it was a product.
              </p>
              <p>
                The job tracker template came first: a team member was searching
                for a new role and nothing on the market felt right. We built
                what they needed in an afternoon. The freelance tracker followed.
                By the time we had three templates, we had the shape of something
                real — a board that knew what it was for.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values ─────────────────────────────────────────── */}
      <section className="ab-section ab-values-section">
        <div className="ab-section-inner">
          <p className="ab-eyebrow">What we believe</p>
          <h2 className="ab-values-heading">Three words.<br /><em>One standard.</em></h2>
          <div className="ab-values">
            {VALUES.map((v, i) => (
              <div key={i} className="ab-value">
                <span className="ab-value-index">0{i + 1}</span>
                <h3 className="ab-value-word">{v.word}</h3>
                <p className="ab-value-body">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stack ──────────────────────────────────────────── */}
      <section className="ab-section ab-stack-section">
        <div className="ab-section-inner">
          <p className="ab-eyebrow">Built with</p>
          <h2 className="ab-stack-heading">
            Technology chosen<br /><em>with intention.</em>
          </h2>
          <p className="ab-stack-sub">
            Every tool in our stack was chosen for a reason — not because it was
            trending, but because it was right for the job.
          </p>
          <div className="ab-stack-grid">
            {STACK.map(s => (
              <div key={s.name} className="ab-stack-card" style={{ '--s-color': s.color, '--s-bg': s.bg }}>
                <span className="ab-stack-name">{s.name}</span>
                <span className="ab-stack-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="ab-cta">
        <div className="ab-cta-inner">
          <h2 className="ab-cta-h2">
            The board is waiting.<br />
            <em>Make it yours.</em>
          </h2>
          <p className="ab-cta-sub">
            Start with a template or build from scratch. Either way, you'll
            have a board that fits the way you work in under two minutes.
          </p>
          <div className="ab-cta-actions">
            <Link to="/login" className="ab-btn ab-btn-primary ab-btn-lg">Get started free →</Link>
            <Link to="/" className="ab-btn-outline-lg">See the product</Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="ab-footer">
        <div className="ab-footer-left">
          <LogoSVG height={20} />
          <span className="ab-footer-credit">Designed and built by SC Design and Consultation</span>
          <span className="ab-footer-copy">© {new Date().getFullYear()} Taskmaster Pro</span>
        </div>
        <div className="ab-footer-links">
          <Link to="/">Product</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/login">Get started</Link>
        </div>
      </footer>
    </div>
  )
}
