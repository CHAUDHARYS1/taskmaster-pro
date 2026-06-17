import { lazy, Suspense, useState } from 'react'
import { List, SquaresFour, GearSix } from '@phosphor-icons/react'
import PageHint from '../ui/PageHint'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import DashboardView from './DashboardView'
import { BellButton } from '../notifications/NotificationCenter'

const SettingsModal           = lazy(() => import('../ui/SettingsModal'))
const WorkspaceSettingsPanel  = lazy(() => import('../workspace/WorkspaceSettingsPanel'))

export default function DashboardPage() {
  const { currentWorkspace, loading, userRole } = useWorkspace()
  const [showSidebar,  setShowSidebar]  = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [showSettings,   setShowSettings]   = useState(false)
  const [showWsSettings, setShowWsSettings] = useState(false)

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev
      localStorage.setItem('tm_sidebar_collapsed', String(next))
      return next
    })
  }

  if (loading) return <div className="loading-screen">Loading…</div>

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} onProfileClick={() => setShowSettings(true)} />

      <main className="board-main">
        <div className="mobile-appbar">
          <button className="sidebar-toggle" onClick={() => setShowSidebar(prev => !prev)} aria-label="Toggle sidebar">
            <List size={22} aria-hidden="true" />
          </button>
          <div className="mobile-appbar-title">
            <div className="mobile-appbar-text">
              <div className="mobile-appbar-sub">Dashboard</div>
              <div className="mobile-appbar-ws"><span>All workspaces</span></div>
            </div>
          </div>
          <div className="mobile-appbar-actions">
            <button
              className="mobile-appbar-settings-btn"
              onClick={() => setShowWsSettings(true)}
              aria-label="Workspace settings"
            >
              <GearSix size={20} aria-hidden="true" />
            </button>
            <span className="mobile-appbar-sep" aria-hidden="true" />
            <BellButton />
          </div>
        </div>
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <SquaresFour size={18} className="board-header-icon" aria-hidden="true" />
            <span className="board-header-title">Dashboard</span>
          </div>
          <div className="board-header-right">
            <PageHint text="A snapshot of your workspaces — task counts, progress, overdue items, and what's coming up across all your projects." />
          </div>
        </div>

        <DashboardView />
      </main>

      <Suspense fallback={null}>
        {showSettings   && <SettingsModal          onClose={() => setShowSettings(false)} />}
        {showWsSettings && <WorkspaceSettingsPanel onClose={() => setShowWsSettings(false)} canEdit={userRole !== 'viewer'} />}
      </Suspense>
    </div>
  )
}
