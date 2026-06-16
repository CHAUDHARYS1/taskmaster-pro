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
        <a href="#product" className="lp-nav-link">Features</a>
        <a href="#templates" className="lp-nav-link">Templates</a>
        <Link to="/pricing" className="lp-nav-link">Pricing</Link>
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

/* ─── Trust strip ───────────────────────────────────────── */
function TrustStrip() {
  return (
    <div className="lp-trust">
      <span className="lp-trust-label">Trusted by focused people at</span>
      <div className="lp-trust-row">
        {['Northwind', 'Opal Foods', 'Crest Media', 'Dune Studio', 'Aria Health', 'Moss Co.'].map(name => (
          <span key={name}>{name}</span>
        ))}
      </div>
    </div>
  )
}

/* ─── Product showcase ──────────────────────────────────── */
function ProductShowcase() {
  return (
    <section className="lp-section" id="product">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">See it in action</p>
        <h2 className="lp-section-heading">One dataset,<br /><em>seen four ways.</em></h2>
        <p className="lp-section-sub">
          The same tasks, surfaced however you need them — drag them on a board,
          open the full story on a card, or see the whole month at a glance.
        </p>

        {/* Board view */}
        <div className="lp-show">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Board view</p>
            <h3>A board that bends to <em>your workflow.</em></h3>
            <p>Name your columns, color them, and reorder them by dragging. Cards carry priority and labels so status reads at a glance.</p>
            <ul className="lp-feat-list">
              <li>Unlimited, fully configurable columns</li>
              <li>Drag-and-drop with live, instant sync</li>
              <li>Colored left rule encodes task state</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <MiniBoard board={TEMPLATE_BOARDS.blank} animate={false} />
          </div>
        </div>

        {/* Task detail */}
        <div className="lp-show lp-show--flip">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Task detail</p>
            <h3>Every card holds <em>the whole story.</em></h3>
            <p>Open a task to find a rich description, checklist with progress, priority, labels, assignee, due date, and a comment thread — all in one focused panel.</p>
            <ul className="lp-feat-list">
              <li>Checklists with a live completion bar</li>
              <li>Priority from Low to Urgent</li>
              <li>Due dates that flag when they're close</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <div className="tm-win">
              <div className="tm-win-bar">
                <span className="tm-dot" /><span className="tm-dot" /><span className="tm-dot" />
                <span className="tm-win-title">Task detail</span>
              </div>
              <div className="tm-task">
                <div className="tm-task-crumb">Freelance Tracker › <b>In Progress</b></div>
                <div className="tm-task-title">Crest Media — marketing site redesign</div>
                <div className="tm-chiprow">
                  <span className="tm-chip" style={{ background:'rgba(248,113,113,.16)', color:'#b91c1c' }}>!! Urgent</span>
                  <span className="tm-chip" style={{ background:'rgba(45,212,191,.14)', color:'#0f766e' }}>Retainer</span>
                  <span className="tm-chip" style={{ background:'rgba(124,58,237,.12)', color:'#7c3aed' }}>Design</span>
                </div>
                <div className="tm-task-desc">Full redesign of the marketing site — new hero, pricing, and case-study templates. Client wants a more editorial look before their Q3 launch.</div>
                <div className="tm-block-label"><span>Checklist</span><span>3 / 4</span></div>
                <div className="tm-track"><i style={{ width: '75%' }} /></div>
                <div className="tm-check done"><i>✓</i><span>Wireframe hero + pricing</span></div>
                <div className="tm-check done"><i>✓</i><span>Design-system tokens</span></div>
                <div className="tm-check done"><i>✓</i><span>Build responsive layout</span></div>
                <div className="tm-check"><i /><span>Final QA pass</span></div>
                <div className="tm-task-foot">
                  <div className="tm-assignee">
                    <span className="tm-ava" style={{ background: '#7c3aed' }}>SC</span>
                    Sara C.
                  </div>
                  <span className="tm-due">Due Aug 28</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar view */}
        <div className="lp-show">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Calendar view</p>
            <h3>See the week, <em>not just the list.</em></h3>
            <p>Flip any board into a calendar to spot crunch days before they arrive. Due dates land on their day, color-coded by column.</p>
            <ul className="lp-feat-list">
              <li>Every dated task, on its day</li>
              <li>Color inherited from its column</li>
              <li>One dataset — never out of sync</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <div className="tm-win">
              <div className="tm-win-bar">
                <span className="tm-dot" /><span className="tm-dot" /><span className="tm-dot" />
                <span className="tm-win-title">Calendar — August</span>
              </div>
              <MiniCal />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── Mini calendar mockup ───────────────────────────────── */
const CAL_DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const CAL_EVENTS = {
  4: [['Kickoff','#6366f1']], 7: [['Audit','#0ea5e9']], 12: [['Wireframes','#d97706']],
  14: [['Design review','#7c3aed']], 18: [['Build','#0ea5e9']], 21: [['Standup','#2563EB']],
  25: [['QA pass','#d97706']], 28: [['Crest launch','#ef4444'],['Invoice','#22c55e']], 30: [['Retro','#6b7280']],
}
function MiniCal() {
  const cells = []
  for (let i = 0; i < 4; i++) cells.push(<div key={`e${i}`} className="tm-cal-cell off" />)
  for (let d = 1; d <= 31; d++) {
    const evs = CAL_EVENTS[d] || []
    cells.push(
      <div key={d} className={`tm-cal-cell${d === 21 ? ' today' : ''}`}>
        <span className="tm-cal-n">{d}</span>
        {evs.map(([label, c]) => (
          <span key={label} className="tm-cal-ev" style={{ background: c }}>{label}</span>
        ))}
      </div>
    )
  }
  return (
    <div className="tm-cal">
      <div className="tm-cal-head">
        <span className="tm-cal-month">August 2025</span>
        <div className="tm-cal-nav"><span>‹</span><span>›</span></div>
      </div>
      <div className="tm-cal-grid">
        {CAL_DOW.map(d => <div key={d} className="tm-cal-dow">{d}</div>)}
        {cells}
      </div>
    </div>
  )
}

/* ─── Teams showcase ─────────────────────────────────────── */
function TeamsShowcase() {
  return (
    <section className="lp-section lp-section--alt-2" id="teams">
      <div className="lp-section-inner">
        <p className="lp-eyebrow">More than a board</p>
        <h2 className="lp-section-heading">An entire workspace,<br /><em>working as one.</em></h2>
        <p className="lp-section-sub">
          Insight, alerts, and real-time teamwork are built in — so the whole picture
          lives in one place, and nothing slips through.
        </p>

        {/* Dashboard */}
        <div className="lp-show">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Dashboard</p>
            <h3>Know exactly <em>where things stand.</em></h3>
            <p>Every workspace rolls up into a live dashboard — throughput, completion rate, and what's due — so your status update writes itself.</p>
            <ul className="lp-feat-list">
              <li>Tasks completed, trended week over week</li>
              <li>Completion rate across the whole board</li>
              <li>Workload at a glance, by day</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <div className="tm-win">
              <div className="tm-win-bar">
                <span className="tm-dot" /><span className="tm-dot" /><span className="tm-dot" />
                <span className="tm-win-title">Dashboard — this week</span>
              </div>
              <div className="tm-dash">
                <div className="tm-dash-tiles">
                  <div className="tm-tile up">
                    <div className="tm-tile-n">47</div>
                    <div className="tm-tile-l">Tasks done</div>
                    <div className="tm-tile-trend">↑ 12% wk/wk</div>
                  </div>
                  <div className="tm-tile"><div className="tm-tile-n">23</div><div className="tm-tile-l">In progress</div></div>
                  <div className="tm-tile"><div className="tm-tile-n">6</div><div className="tm-tile-l">Due this week</div></div>
                </div>
                <div className="tm-dash-panel" style={{ marginBottom: 10 }}>
                  <div className="tm-dash-panel-h">Completed per day</div>
                  <div className="tm-bars">
                    {[['5','42%','M'],['8','64%','T'],['6','50%','W'],['11','90%','T'],['9','74%','F'],['2','20%','S',true],['1','12%','S',true]].map(([v,h,d,m]) => (
                      <div key={d+v} className={`tm-bar${m ? ' muted' : ''}`}>
                        <span className="tm-bar-val">{v}</span>
                        <i style={{ height: h }} />
                        <span>{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="tm-dash-panel">
                  <div className="tm-ring-wrap">
                    <div className="tm-ring" style={{ '--p': 86 }}><span>86%</span></div>
                    <div className="tm-ring-meta"><b>Completion rate</b>129 of 150 tasks closed this cycle. On track for Friday.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="lp-show lp-show--flip">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Notification center</p>
            <h3>Never miss <em>what matters.</em></h3>
            <p>Mentions, assignments, and approaching due dates land in one tidy inbox — not scattered across email. Filter to just what's yours and clear it in seconds.</p>
            <ul className="lp-feat-list">
              <li>@-mentions and replies, in real time</li>
              <li>Assignment and due-soon alerts</li>
              <li>Filter by mentions or what's assigned to you</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <div className="tm-win">
              <div className="tm-win-bar">
                <span className="tm-dot" /><span className="tm-dot" /><span className="tm-dot" />
                <span className="tm-win-title">Notifications</span>
              </div>
              <div className="tm-notif-head">
                <div className="tm-notif-title">Notifications <span className="tm-notif-badge">4 new</span></div>
                <div className="tm-notif-clear">Mark all read</div>
              </div>
              <div className="tm-notif-tabs">
                <span className="tm-notif-tab on">All</span>
                <span className="tm-notif-tab">Mentions</span>
                <span className="tm-notif-tab">Assigned</span>
              </div>
              <div className="tm-notif-row unread">
                <span className="tm-notif-ava" style={{ background:'#7c3aed' }}>SP</span>
                <div className="tm-notif-body"><b>Sara Park</b> mentioned you in <b>Dashboard redesign</b> — "can we tighten the heatmap spacing?"<span className="tm-notif-time">2m ago</span></div>
                <span className="tm-notif-dot" />
              </div>
              <div className="tm-notif-row unread">
                <span className="tm-notif-ava" style={{ background:'#0f766e' }}>JO</span>
                <div className="tm-notif-body"><b>Jon Okafor</b> assigned you <b>Final QA pass</b><span className="tm-notif-time">1h ago</span></div>
                <span className="tm-notif-dot" />
              </div>
              <div className="tm-notif-row unread">
                <span className="tm-notif-ico" style={{ background:'rgba(217,119,6,.14)', color:'#b45309' }}>⧖</span>
                <div className="tm-notif-body"><b>Crest Media — site redesign</b> is due tomorrow<span className="tm-notif-time">3h ago</span></div>
                <span className="tm-notif-dot" />
              </div>
              <div className="tm-notif-row">
                <span className="tm-notif-ico" style={{ background:'rgba(34,197,94,.14)', color:'#15803d' }}>✓</span>
                <div className="tm-notif-body"><b>Maya Chen</b> completed <b>Build responsive layout</b><span className="tm-notif-time">5h ago</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time collab */}
        <div className="lp-show">
          <div className="lp-show-copy">
            <p className="lp-eyebrow">Real-time collaboration</p>
            <h3>Built for teams, <em>live.</em></h3>
            <p>See who's online, watch edits happen as they're made, and know exactly who's touching a card. No refreshes, no overwrites, no "who changed this?"</p>
            <ul className="lp-feat-list">
              <li>Live presence — see your team online</li>
              <li>Real-time cursors and editing locks</li>
              <li>A shared activity trail for every board</li>
            </ul>
          </div>
          <div className="lp-show-media">
            <div className="tm-win">
              <div className="tm-win-bar">
                <span className="tm-dot" /><span className="tm-dot" /><span className="tm-dot" />
                <span className="tm-win-title">My Workspace — live</span>
              </div>
              <div className="tm-collab">
                <div className="tm-presence">
                  <div className="tm-presence-avas">
                    <span className="tm-ava" style={{ background:'#7c3aed' }}>SP</span>
                    <span className="tm-ava" style={{ background:'#0f766e' }}>JO</span>
                    <span className="tm-ava" style={{ background:'#2563EB' }}>MC</span>
                    <span className="tm-presence-more">+2</span>
                  </div>
                  <div className="tm-presence-live"><span className="tm-live-dot" />5 online now</div>
                </div>
                <div className="tm-collab-board">
                  <div className="tm-cboard-card editing" style={{ '--c':'#0ea5e9' }}>
                    <div className="tm-cboard-t">Dashboard redesign</div>
                    <div className="tm-cboard-meta"><span className="tm-editing-tag">✎ Sara is editing…</span></div>
                  </div>
                  <div className="tm-cboard-card" style={{ '--c':'#d97706' }}>
                    <div className="tm-cboard-t">Onboarding flow</div>
                    <div className="tm-cboard-meta"><span className="tm-ava" style={{ width:18, height:18, fontSize:8, background:'#0f766e' }}>JO</span></div>
                  </div>
                  <div className="tm-cursor" style={{ left:118, top:34 }}>
                    <svg viewBox="0 0 16 16" fill="none"><path d="M1 1l5.5 13 2-5.5L14 6.5 1 1z" fill="#7c3aed" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    <span className="tm-cursor-label" style={{ background:'#7c3aed' }}>Sara Park</span>
                  </div>
                </div>
                <div className="tm-collab-activity">
                  <div className="tm-act-label">Activity</div>
                  <div className="tm-act-row"><span className="tm-ava" style={{ background:'#2563EB' }}>MC</span><span><b>Maya</b> moved <b>Build responsive layout</b> to Done</span><time>5h</time></div>
                  <div className="tm-act-row"><span className="tm-ava" style={{ background:'#0f766e' }}>JO</span><span><b>Jon</b> added label <b>Retainer</b></span><time>6h</time></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
      <TrustStrip />
      <ProductShowcase />
      <Templates />
      <TeamsShowcase />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  )
}
