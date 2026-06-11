import { lazy, Suspense, useState } from 'react'
import { List, Newspaper } from '@phosphor-icons/react'
import Sidebar from '../components/layout/Sidebar'
import { RELEASES } from '../data/releaseNotes'
import './release-notes.css'

const SettingsModal = lazy(() => import('../components/ui/SettingsModal'))

const SIDEBAR_COLLAPSE_KEY = 'tm_sidebar_collapsed'

export default function ReleaseNotesPage() {
  const [showSidebar,     setShowSidebar]     = useState(false)
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
            <Newspaper size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Release Notes</span>
          </div>
        </div>

        <div className="rn-main">
          <div className="rn-page-header">
            <h1 className="rn-page-title">What's New</h1>
            <p className="rn-page-subtitle">
              A running log of features, improvements, and fixes — newest first.
            </p>
          </div>

          <ol className="rn-timeline" aria-label="Release history">
            {RELEASES.map(release => (
              <li
                key={release.version}
                className={`rn-release${release.current ? ' rn-release--current' : ''}`}
              >
                <div className="rn-release-header">
                  <span className="rn-version">v{release.version}</span>
                  {release.current && (
                    <span className="rn-badge-current" aria-label="Current version">Current</span>
                  )}
                  <span className="rn-date">{release.date}</span>
                </div>

                {release.features.length > 0 && (
                  <section className="rn-section rn-section--features" aria-label="New features">
                    <h2 className="rn-section-title">
                      <span className="rn-section-icon" aria-hidden="true">✨</span>
                      New Features
                    </h2>
                    <ul className="rn-entries">
                      {release.features.map((item, i) => (
                        <li key={i} className="rn-entry">
                          <p className="rn-entry-title">{item.title}</p>
                          <p className="rn-entry-body">{item.body}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {release.fixes.length > 0 && (
                  <section className="rn-section rn-section--fixes" aria-label="Bug fixes">
                    <h2 className="rn-section-title">
                      <span className="rn-section-icon" aria-hidden="true">🐛</span>
                      Bug Fixes
                    </h2>
                    <ul className="rn-entries">
                      {release.fixes.map((item, i) => (
                        <li key={i} className="rn-entry">
                          <p className="rn-entry-title">{item.title}</p>
                          <p className="rn-entry-body">{item.body}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {release.hotfixes.length > 0 && (
                  <section className="rn-section rn-section--hotfixes" aria-label="Hotfixes">
                    <h2 className="rn-section-title">
                      <span className="rn-section-icon" aria-hidden="true">🔥</span>
                      Hotfixes
                    </h2>
                    <ul className="rn-entries">
                      {release.hotfixes.map((item, i) => (
                        <li key={i} className="rn-entry">
                          <p className="rn-entry-title">{item.title}</p>
                          <p className="rn-entry-body">{item.body}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </li>
            ))}
          </ol>
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
