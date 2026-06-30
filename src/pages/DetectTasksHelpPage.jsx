import { lazy, Suspense, useState } from 'react'
import { List, Sparkle } from '@phosphor-icons/react'
import Sidebar from '../components/layout/Sidebar'
import './detect-tasks-help.css'

const SettingsModal = lazy(() => import('../components/ui/SettingsModal'))

const SIDEBAR_COLLAPSE_KEY = 'tm_sidebar_collapsed'

export default function DetectTasksHelpPage() {
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true'
  )
  const [showSettings, setShowSettings] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, String(next))
      return next
    })
  }

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar
        isOpen={showSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
        onProfileClick={() => setShowSettings(true)}
      />

      <main id="main-content" className="board-main">
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <Sparkle size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Detect Tasks — Guide</span>
          </div>
        </div>

        <div className="dth-main">
          <div className="dth-page-header">
            <h1 className="dth-page-title">How Detect Tasks works</h1>
            <p className="dth-page-subtitle">
              Detect Tasks uses AI to read your document and pull out actionable items. Click the <Sparkle size={14} aria-hidden="true" /> button in the editor toolbar — results appear in a side panel in a few seconds.
            </p>
          </div>

          <div className="dth-content">

            {/* ── What it detects ── */}
            <section className="dth-section">
              <h2 className="dth-section-title">What gets detected</h2>
              <p className="dth-section-intro">
                The AI looks for anything that represents work someone needs to do — not observations, general notes, or already-completed items.
              </p>
              <ul className="dth-tips">
                <li><strong>Checkboxes</strong> — the clearest signal. Each unchecked item is a strong candidate.</li>
                <li><strong>Bullet and numbered lists</strong> — each item is evaluated as a potential task.</li>
                <li><strong>Prose sentences</strong> — action-oriented sentences ("Schedule a call with the team") are detected even without list formatting.</li>
                <li><strong>Headings with lists beneath them</strong> — the heading becomes the task title; the sub-items are context, not separate tasks.</li>
                <li><strong>Due dates</strong> — natural language ("by Friday", "next Monday", "before the 20th") is parsed into a date that pre-fills the due date field.</li>
              </ul>
            </section>

            {/* ── Heading grouping ── */}
            <section className="dth-section">
              <div className="dth-rule-badge dth-rule-badge--teal">Grouping</div>
              <h2 className="dth-section-title">Heading + list = one task</h2>
              <p className="dth-section-intro">
                When a list appears directly under a heading, the whole group is detected as <strong>one task</strong> using the heading as the title. This prevents a checklist of 10 sub-items from creating 10 board cards.
              </p>
              <div className="dth-group-example">
                <div className="dth-group-row dth-group-row--heading">
                  <span className="dth-group-tag">Title</span>
                  <span className="dth-group-text">## Fix the login bug</span>
                </div>
                <div className="dth-group-row dth-group-row--desc">
                  <span className="dth-group-tag">Context</span>
                  <span className="dth-group-text">Safari users can't sign in since the last deploy.</span>
                </div>
                <div className="dth-group-row dth-group-row--list">
                  <span className="dth-group-tag">Sub-item</span>
                  <span className="dth-group-text">☐ Debug the auth error</span>
                </div>
                <div className="dth-group-row dth-group-row--list">
                  <span className="dth-group-tag">Sub-item</span>
                  <span className="dth-group-text">☐ Test on iPhone and iPad</span>
                </div>
                <div className="dth-group-arrow">
                  → 1 task detected: "Fix the login bug"
                </div>
              </div>
              <p className="dth-section-intro" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                Lists with <strong>no heading above them</strong> produce individual tasks — one per item.
              </p>
            </section>

            {/* ── What it skips ── */}
            <section className="dth-section">
              <h2 className="dth-section-title">What gets skipped</h2>
              <ul className="dth-tips">
                <li><strong>Completed items</strong> — checked boxes (☑) are ignored.</li>
                <li><strong>Observations and notes</strong> — statements like "The meeting was great" or "Sales were up 10%" are not tasks.</li>
                <li><strong>Pure information</strong> — if it doesn't require someone to do something, it won't appear.</li>
              </ul>
            </section>

            {/* ── Tips ── */}
            <section className="dth-section">
              <h2 className="dth-section-title">Tips for better results</h2>
              <ul className="dth-tips">
                <li><strong>Use checkboxes for explicit to-dos.</strong> They're the strongest signal — the AI treats every unchecked box as a task candidate.</li>
                <li><strong>Use headings to name a task, not a section.</strong> "## Fix the login bug" is a better heading than "## Bugs" if you want one grouped task.</li>
                <li><strong>Include dates in-line.</strong> "Schedule standup by Monday" lets the AI pre-fill the due date — no manual entry needed.</li>
                <li><strong>Write action-first sentences.</strong> "Call the vendor to confirm the quote" is detected more reliably than "The vendor quote needs confirming."</li>
                <li><strong>Review before adding.</strong> You can edit task titles and dates directly in the panel, and deselect anything you don't want on the board.</li>
              </ul>
            </section>

          </div>
        </div>
      </main>

      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal onClose={() => setShowSettings(false)} />
        </Suspense>
      )}
    </div>
  )
}
