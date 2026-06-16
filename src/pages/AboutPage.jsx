import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

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
        <Link to="/" className="lp-nav-link">Features</Link>
        <Link to="/" className="lp-nav-link">Templates</Link>
        <Link to="/pricing" className="lp-nav-link">Pricing</Link>
        <Link to="/about" className="lp-nav-link" aria-current="page">About</Link>
      </div>
      <div className="lp-nav-actions">
        <Link to="/login" className="lp-btn lp-btn-ghost">Sign in</Link>
        <Link to="/login" className="lp-btn lp-btn-primary">Get started</Link>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-left">
        <LogoSVG height={20} />
        <span className="lp-footer-credit">Designed and built by SC Design and Consultation</span>
        <span className="lp-footer-copy">© {new Date().getFullYear()} Taskmaster Pro</span>
      </div>
      <div className="lp-footer-links">
        <Link to="/">Product</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/about">About</Link>
        <Link to="/login">Sign in</Link>
      </div>
    </footer>
  )
}

const VALUES = [
  {
    ico: '◈',
    title: 'Your workflow, respected',
    body: "We don't impose a \"right\" way to work. Every column, color, and label bends to your process — never the reverse.",
  },
  {
    ico: '☑',
    title: 'Dense, but never noisy',
    body: 'Information-rich by design, quiet by default. Everything earns its place on the screen, or it doesn\'t ship.',
  },
  {
    ico: '⚡',
    title: 'Fast and always in sync',
    body: 'Real-time presence, instant saves, no reloads. The board you see is the board your collaborators see.',
  },
]

const TIMELINE = [
  { when: '2023', title: 'A wall of sticky notes', body: 'The first prototype was a single board built to survive one stressful job search. It worked — so the columns kept multiplying.' },
  { when: '2024', title: 'Workspaces & templates', body: 'Configurable workspaces landed, with the first three templates. One board became every board.' },
  { when: '2025', title: 'Four views, in real time', body: 'Board, List, Calendar, and Archive over one dataset — plus live presence and instant sync for small teams.' },
  { when: 'Now',  title: 'Thoughtful AI, on request', body: 'Optional AI suggestions and automations that help when you want them and disappear when you don\'t.' },
]

const STACK = [
  { name: 'React 18',  desc: 'Component UI',    color: '#61dafb', bg: 'rgba(97,218,251,.1)'  },
  { name: 'Vite',      desc: 'Build tooling',   color: '#bd34fe', bg: 'rgba(189,52,254,.1)'  },
  { name: 'Supabase',  desc: 'Database + auth', color: '#3ecf8e', bg: 'rgba(62,207,142,.1)'  },
  { name: '@dnd-kit',  desc: 'Drag & drop',     color: '#f59e0b', bg: 'rgba(245,158,11,.1)'  },
  { name: 'Phosphor',  desc: 'Icon system',     color: '#2563EB', bg: 'rgba(37,99,235,.1)'   },
  { name: 'TipTap',    desc: 'Rich text',       color: '#6366f1', bg: 'rgba(99,102,241,.1)'  },
]

export default function AboutPage() {
  useEffect(() => {
    document.title = 'About — Taskmaster Pro'
    return () => { document.title = 'Taskmaster Pro' }
  }, [])

  return (
    <div className="lp">
      <Nav />

      <header className="lp-pagehead" id="main-content">
        <p className="lp-eyebrow">About Taskmaster Pro</p>
        <h1>Built for the way you<br /><em>actually work.</em></h1>
        <p>
          Most task tools make you bend to their idea of a workflow. We started
          Taskmaster Pro on a simple conviction: the board should adapt to you —
          not the other way around.
        </p>
      </header>

      {/* Story */}
      <section className="lp-section">
        <div className="lp-prose">
          <p className="lp-lead">It began with a job search and a wall of sticky notes that never quite fit any app on the market.</p>
          <p>
            Every tool was either a stripped-down checklist that forgot the details, or an enterprise platform
            that buried the work under settings nobody asked for. We wanted something in between —{' '}
            <strong>dense and capable, but calm.</strong> A board you could shape in minutes and trust for years.
          </p>
          <p>
            So we built Taskmaster Pro around <strong>configurable workspaces</strong>. Start from a purpose-built
            template — a job application tracker, a freelance project pipeline, or a blank slate — then make every
            column, color, and label your own. The same set of tasks shows up as a board, a list, a calendar, or
            an archive, so the view changes but the truth never does.
          </p>
          <p>
            Today it's a real-time, collaborative product used by job-seekers, freelancers, and small teams who
            care about the texture of their own process. It stays out of the way until you need it, then holds
            the whole picture when you do.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="lp-section lp-section--alt-2">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">What we believe</p>
          <h2 className="lp-section-heading">Principles, <em>not features.</em></h2>
          <p className="lp-section-sub">
            A short list we keep coming back to whenever we decide what to build —
            and, just as often, what to leave out.
          </p>
          <div className="lp-values">
            {VALUES.map(v => (
              <div key={v.title} className="lp-value">
                <div className="lp-value-ico">{v.ico}</div>
                <h3>{v.title}</h3>
                <p>{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">How we got here</p>
          <h2 className="lp-section-heading">A short <em>history.</em></h2>
          <p className="lp-section-sub">
            No big launch, no funding round — just steady, opinionated work shaped by the people using it.
          </p>
          <div className="lp-timeline">
            {TIMELINE.map(t => (
              <div key={t.when} className="lp-tl-item">
                <div className="lp-tl-dot" />
                <div className="lp-tl-when">{t.when}</div>
                <div className="lp-tl-body">
                  <h4>{t.title}</h4>
                  <p>{t.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="lp-section lp-section--alt-2">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">Built with</p>
          <h2 className="lp-section-heading">Technology chosen<br /><em>with intention.</em></h2>
          <p className="lp-section-sub">
            Every tool in our stack was chosen for a reason — not because it was
            trending, but because it was right for the job.
          </p>
          <div className="lp-bento" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {STACK.map(s => (
              <div
                key={s.name}
                className="lp-bento-card"
                style={{ borderTop: `3px solid ${s.color}`, background: s.bg }}
              >
                <div className="lp-bento-card-name" style={{ fontSize: 15, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maker */}
      <section className="lp-section">
        <div className="lp-section-inner">
          <p className="lp-eyebrow">Who builds it</p>
          <h2 className="lp-section-heading">A small studio,<br /><em>sweating the details.</em></h2>
          <p className="lp-section-sub">
            Taskmaster Pro is designed and built by a tiny team that uses it every single day.
          </p>
          <div className="lp-maker">
            <div className="lp-maker-mark">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 52" width="44" height="44" aria-hidden="true">
                <g transform="translate(2,4)">
                  <rect width="44" height="44" rx="11.4" fill="rgba(255,255,255,0.15)" />
                  <path d="M12.3 22.9 L19.4 29.9 L32.6 15" fill="none" stroke="#FFFFFF" strokeWidth="5.3" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
            <div>
              <h3>SC Design and Consultation</h3>
              <p>
                An independent product studio focused on calm, capable software. We design and build
                Taskmaster Pro end to end — from the token system to the task card's 3-pixel left rule —
                and we answer the support emails ourselves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta">
        <h2>Make it yours <em>today.</em></h2>
        <p>Pick a template, name your workspace, and shape the board around your work in minutes.</p>
        <div className="lp-cta-actions">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Start for free →</Link>
          <Link to="/pricing" className="lp-btn-outline-lg">See pricing</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
