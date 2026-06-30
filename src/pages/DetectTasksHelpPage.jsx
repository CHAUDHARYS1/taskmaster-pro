import { lazy, Suspense, useState } from 'react'
import { List, Sparkle } from '@phosphor-icons/react'
import Sidebar from '../components/layout/Sidebar'
import './detect-tasks-help.css'

const SettingsModal = lazy(() => import('../components/ui/SettingsModal'))

const SIDEBAR_COLLAPSE_KEY = 'tm_sidebar_collapsed'

const KEYWORDS = [
  'need to', 'have to', 'should', 'must', 'remember to',
  "don't forget to", 'todo', 'to-do', 'action item', 'follow up on',
]

const VERBS = [
  'Call', 'Email', 'Send', 'Fix', 'Update', 'Schedule', 'Review',
  'Finish', 'Submit', 'Prepare', 'Contact', 'Draft', 'Confirm',
  'Book', 'Create', 'Set up', 'Check',
]

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
            <span className="board-header-title">Detect Tasks — Formatting Guide</span>
          </div>
        </div>

        <div className="dth-main">
          <div className="dth-page-header">
            <h1 className="dth-page-title">Get more out of Detect Tasks</h1>
            <p className="dth-page-subtitle">
              The detector is rule-based — no AI. It reads your document's structure and scores each item. Here's what it looks for and how to write for maximum coverage.
            </p>
          </div>

          <div className="dth-content">

            {/* ── Confidence dots ── */}
            <section className="dth-section">
              <h2 className="dth-section-title">Confidence dots</h2>
              <p className="dth-section-intro">Each detected candidate shows a small dot indicating how confident the detector is. You can always include or exclude any item regardless of score.</p>
              <ul className="dth-dot-legend">
                <li className="dth-dot-row">
                  <span className="dth-dot" style={{ background: 'var(--green)' }} aria-hidden="true" />
                  <div>
                    <strong>High match</strong> — score 6+. Multiple signals hit: list structure, action verb, keyword, and/or a date.
                  </div>
                </li>
                <li className="dth-dot-row">
                  <span className="dth-dot" style={{ background: 'var(--accent)' }} aria-hidden="true" />
                  <div>
                    <strong>Likely task</strong> — score 4–5. Clear structural cue with at least one additional signal.
                  </div>
                </li>
                <li className="dth-dot-row">
                  <span className="dth-dot" style={{ background: 'var(--ink-4)' }} aria-hidden="true" />
                  <div>
                    <strong>Possible task</strong> — score 3. Meets the minimum threshold, usually from structure alone.
                  </div>
                </li>
              </ul>
            </section>

            {/* ── Rule 1: Structure ── */}
            <section className="dth-section">
              <div className="dth-rule-badge">+3 pts</div>
              <h2 className="dth-section-title">Rule 1 — Use lists and checkboxes</h2>
              <p className="dth-section-intro">
                The biggest signal. Any list-formatted item in the toolbar automatically scores +3, which is enough to be detected on its own.
              </p>
              <div className="dth-examples">
                <div className="dth-example">
                  <p className="dth-example-label">Checkboxes (task list)</p>
                  <div className="dth-example-doc">
                    <span className="dth-check">☐</span> Buy groceries<br />
                    <span className="dth-check">☐</span> Review the proposal<br />
                    <span className="dth-check dth-check--done">☑</span> <span className="dth-done-text">Already done — still detected</span>
                  </div>
                  <p className="dth-example-tip">Best for: explicit to-do items. Use the toolbar's checkbox button or type <code>- [ ]</code>.</p>
                </div>
                <div className="dth-example">
                  <p className="dth-example-label">Bullet points</p>
                  <div className="dth-example-doc">
                    • Call the client<br />
                    • Send the invoice<br />
                    • Schedule a follow-up
                  </div>
                  <p className="dth-example-tip">Best for: quick action lists. Every bullet is a candidate.</p>
                </div>
                <div className="dth-example">
                  <p className="dth-example-label">Numbered lists</p>
                  <div className="dth-example-doc">
                    1. Draft the email<br />
                    2. Get sign-off from legal<br />
                    3. Send by Friday
                  </div>
                  <p className="dth-example-tip">Best for: ordered steps. Each numbered item is a candidate.</p>
                </div>
              </div>
            </section>

            {/* ── Rule 2: Keywords ── */}
            <section className="dth-section">
              <div className="dth-rule-badge">+1–2 pts</div>
              <h2 className="dth-section-title">Rule 2 — Trigger keywords</h2>
              <p className="dth-section-intro">
                These words anywhere in the line add +1 each, capped at +2 total. They're especially useful to boost prose sentences that don't have list structure.
              </p>
              <div className="dth-chip-grid" role="list">
                {KEYWORDS.map(kw => (
                  <span key={kw} className="dth-chip" role="listitem">{kw}</span>
                ))}
              </div>
              <div className="dth-example dth-example--prose">
                <p className="dth-example-label">Example (prose — no list structure)</p>
                <div className="dth-example-doc">
                  You <mark>should</mark> call the vendor. We <mark>need to</mark> confirm the quote.
                </div>
                <p className="dth-example-tip">Without list structure, you need keywords + an action verb to hit the threshold.</p>
              </div>
            </section>

            {/* ── Rule 3: Verbs ── */}
            <section className="dth-section">
              <div className="dth-rule-badge">+2 pts</div>
              <h2 className="dth-section-title">Rule 3 — Action verb at the start</h2>
              <p className="dth-section-intro">
                Starting a line or sentence with one of these imperative verbs adds +2. Combined with list structure (+3) this gives you score 5 — a "likely task" dot.
              </p>
              <div className="dth-chip-grid" role="list">
                {VERBS.map(v => (
                  <span key={v} className="dth-chip" role="listitem">{v}</span>
                ))}
              </div>
              <div className="dth-examples">
                <div className="dth-example">
                  <p className="dth-example-label">High confidence (score 5)</p>
                  <div className="dth-example-doc">
                    <span className="dth-check">☐</span> <mark>Schedule</mark> a call with the team
                  </div>
                </div>
                <div className="dth-example">
                  <p className="dth-example-label">Prose only (score 3) — hits threshold via verb + keyword</p>
                  <div className="dth-example-doc">
                    <mark>Review</mark> the report — you <mark>should</mark> do it today.
                  </div>
                </div>
              </div>
            </section>

            {/* ── Rule 4: Dates ── */}
            <section className="dth-section">
              <div className="dth-rule-badge">+1 pt</div>
              <h2 className="dth-section-title">Rule 4 — Include a due date</h2>
              <p className="dth-section-intro">
                Any readable date expression adds +1 and pre-fills the due date field in the panel. Natural language works — no strict format required.
              </p>
              <div className="dth-chip-grid" role="list">
                {['by Friday', 'next Monday', 'tomorrow', 'by end of week', 'due Jan 15', 'before the 20th', 'next Tuesday', '2025-06-30'].map(d => (
                  <span key={d} className="dth-chip" role="listitem">{d}</span>
                ))}
              </div>
              <div className="dth-example">
                <p className="dth-example-label">Date auto-fills in the panel</p>
                <div className="dth-example-doc">
                  <span className="dth-check">☐</span> Submit the report <mark>by next Monday</mark>
                </div>
              </div>
            </section>

            {/* ── Grouping ── */}
            <section className="dth-section">
              <div className="dth-rule-badge dth-rule-badge--teal">Grouping</div>
              <h2 className="dth-section-title">Heading + list = one task</h2>
              <p className="dth-section-intro">
                When a list appears directly under a heading, the entire group is detected as <strong>one task</strong> — the heading becomes the task title. Any paragraph between the heading and the list becomes the task's description. This prevents a checklist of 10 sub-items from creating 10 board tasks.
              </p>
              <div className="dth-group-example">
                <div className="dth-group-row dth-group-row--heading">
                  <span className="dth-group-tag">Title</span>
                  <span className="dth-group-text">## Fix the login bug</span>
                </div>
                <div className="dth-group-row dth-group-row--desc">
                  <span className="dth-group-tag">Description</span>
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
                  → 1 task detected: "Fix the login bug" with description from the paragraph.
                </div>
              </div>
              <p className="dth-section-intro" style={{ marginTop: 'var(--space-4)', marginBottom: 0 }}>
                Lists with <strong>no heading above them</strong> are still detected as individual tasks — one per item.
              </p>
            </section>

            {/* ── Tips ── */}
            <section className="dth-section">
              <h2 className="dth-section-title">Tips</h2>
              <ul className="dth-tips">
                <li><strong>Checkboxes give the strongest signal</strong> — prefer them over plain bullets when you know something is a task.</li>
                <li><strong>Checked items are still detected.</strong> Deselect them in the panel if you don't want to re-add completed work.</li>
                <li><strong>Prose sentences need at least 2 signals</strong> (e.g., action verb + keyword) to hit the threshold. A sentence like "The meeting is at 3pm" won't be detected.</li>
                <li><strong>Blockquotes and code blocks are ignored</strong> — only headings, paragraphs, and list items are scored.</li>
                <li><strong>Heading + list = 1 task.</strong> All checkboxes under a heading collapse into one board card using the heading as the title. Use headings to avoid clutter when you have many sub-items.</li>
                <li><strong>No heading above a list?</strong> Each item is its own task. Good for loose action lists that aren't part of a named task.</li>
                <li><strong>A new heading resets the context.</strong> Each heading + its following list produces one task independently.</li>
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
