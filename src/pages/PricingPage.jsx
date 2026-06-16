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
        <Link to="/pricing" className="lp-nav-link" aria-current="page">Pricing</Link>
        <Link to="/about" className="lp-nav-link">About</Link>
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

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tag: 'For getting organized, solo.',
    monthly: 0,
    cta: 'Start for free',
    head: 'Includes',
    feats: [
      'Core Kanban board',
      'Up to 3 workspaces',
      'Task labels, priority, due dates',
      'Comments & checklists',
      'Dark mode + keyboard shortcuts',
      '1 personal workspace',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tag: 'For power users who outgrow free.',
    monthly: 7,
    cta: 'Get Pro',
    head: 'Everything in Free, plus',
    feats: [
      'Unlimited workspaces',
      'Team workspaces + invite links',
      'Calendar, Dashboard & Writes',
      'Recurring tasks + reminders',
      'Board templates (Job Tracker, etc.)',
    ],
  },
  {
    id: 'ai',
    name: 'Pro + AI',
    tag: 'For teams who want an edge.',
    monthly: 14,
    cta: 'Get Pro + AI',
    head: 'Everything in Pro, plus',
    feats: [
      'AI task suggestions',
      'AI-powered automation agents',
      'Smart due-date recommendations',
      'AI summarization of task threads',
      'Priority support',
    ],
  },
]

function priceOf(plan, annual) {
  if (plan.monthly === 0) return { n: '0', per: annual ? '/yr' : '/mo', sub: 'Free forever' }
  if (!annual) return { n: String(plan.monthly), per: '/mo', sub: 'per user, billed monthly' }
  const yearly = plan.monthly * 10
  const perMo  = (yearly / 12).toFixed(2)
  return { n: String(yearly), per: '/yr', sub: `$${perMo}/mo, billed annually` }
}

function PlanCard({ plan, annual, featured }) {
  const p   = priceOf(plan, annual)
  const cls = `lp-plan${featured ? ' lp-plan--featured' : ''}`
  const btn = featured ? 'lp-btn lp-btn-primary lp-btn-lg' : 'lp-btn-outline-lg'
  return (
    <div className={cls}>
      {featured && <span className="lp-plan-flag">Most popular</span>}
      <div className="lp-plan-name">{plan.name}</div>
      <div className="lp-plan-tag">{plan.tag}</div>
      <div className="lp-price">
        <span className="lp-price-cur">$</span>
        <span className="lp-price-n">{p.n}</span>
        <span className="lp-price-per">{p.per}</span>
      </div>
      <div className="lp-price-sub">{p.sub}</div>
      <Link to="/login" className={btn}>{plan.cta} →</Link>
      <ul className="lp-plan-feats">
        {plan.head && <li className="lp-feat-head">{plan.head}</li>}
        {plan.feats.map(f => <li key={f}>{f}</li>)}
      </ul>
    </div>
  )
}

const FAQS = [
  {
    q: 'Is the Free plan really free forever?',
    a: 'Yes. Free is free for as long as you use it — no trial clock, no credit card. You get the core board, up to three workspaces, and all the essentials. Upgrade only when you need more.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Switch the toggle to annual and you pay for ten months instead of twelve — two months free. Pro works out to $5.83/mo and Pro + AI to $11.67/mo, both billed once a year.',
  },
  {
    q: 'What\'s included in "Pro + AI"?',
    a: 'Everything in Pro, plus AI task suggestions, automation agents, smart due-date recommendations, thread summarization, and priority support. The AI features are opt-in — your board works exactly the same with them switched off.',
  },
  {
    q: 'Can I change or cancel my plan anytime?',
    a: 'Anytime. Upgrade, downgrade, or cancel from your workspace settings. Changes take effect on your next billing cycle, and downgrading never deletes your data — extra workspaces simply become read-only until you\'re back over the line.',
  },
  {
    q: 'Do team workspaces cost per person?',
    a: 'Pro and Pro + AI are priced per user. Invite your collaborators with a link; each active member on the workspace counts toward billing. Free is single-user, for your own personal workspace.',
  },
  {
    q: 'Is my data safe if I downgrade to Free?',
    a: 'Always. We never delete your tasks. If you drop below a plan\'s limits, the oldest workspaces are archived as read-only and come right back the moment you upgrade again.',
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  useEffect(() => {
    document.title = 'Pricing — Taskmaster Pro'
    return () => { document.title = 'Taskmaster Pro' }
  }, [])

  return (
    <div className="lp">
      <Nav />

      <header className="lp-pagehead" id="main-content">
        <p className="lp-eyebrow">Pricing</p>
        <h1>Simple plans,<br /><em>no surprises.</em></h1>
        <p>Start free and stay free for as long as you like. Upgrade when your work outgrows it — and add AI only if you want the edge.</p>
      </header>

      <section className="lp-section" style={{ paddingTop: 24 }}>
        <div className="lp-section-inner">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="lp-billing">
              <button
                className={annual ? '' : 'on'}
                onClick={() => setAnnual(false)}
                aria-pressed={!annual}
              >
                Monthly
              </button>
              <button
                className={annual ? 'on' : ''}
                onClick={() => setAnnual(true)}
                aria-pressed={annual}
              >
                Annual <span className="lp-save">Save 2 months</span>
              </button>
            </div>
          </div>

          <div className="lp-plans">
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                annual={annual}
                featured={plan.id === 'pro'}
              />
            ))}
          </div>

          <p className="lp-plans-foot">
            Every plan includes unlimited tasks, dark mode, and keyboard shortcuts. No credit card required to start.
          </p>
        </div>
      </section>

      <section className="lp-section lp-section--alt-2">
        <div className="lp-section-inner">
          <p className="lp-eyebrow" style={{ textAlign: 'center' }}>Questions</p>
          <h2 className="lp-section-heading" style={{ textAlign: 'center' }}>Pricing, <em>answered.</em></h2>
          <div className="lp-faq" style={{ marginTop: 44 }}>
            {FAQS.map((faq, i) => (
              <details key={i}>
                <summary>
                  {faq.q}
                  <span className="lp-faq-ico" aria-hidden="true">+</span>
                </summary>
                <div className="lp-faq-a">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <h2>Pick a plan, <em>start in seconds.</em></h2>
        <p>No credit card to begin. Name your workspace and your board is live.</p>
        <div className="lp-cta-actions">
          <Link to="/login" className="lp-btn lp-btn-primary lp-btn-lg">Start for free →</Link>
          <Link to="/about" className="lp-btn-outline-lg">About the project</Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
