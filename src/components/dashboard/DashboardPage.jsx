import { useState } from 'react'
import { List, ChartBar } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import DashboardView from './DashboardView'
import DashboardQuickAdd from './DashboardQuickAdd'

export default function DashboardPage() {
  const { currentWorkspace, loading } = useWorkspace()
  const [showSidebar, setShowSidebar] = useState(false)
  const [refreshKey,  setRefreshKey]  = useState(0)

  if (loading) return <div className="loading-screen">Loading…</div>

  return (
    <div className="app-shell">
      {showSidebar && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)} aria-hidden="true" />
      )}
      <Sidebar isOpen={showSidebar} />

      <main className="board-main">
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <span className="board-header-title">
              {currentWorkspace?.name && (
                <span className="board-header-project">{currentWorkspace.name} / </span>
              )}
              Dashboard
            </span>
          </div>
        </div>

        {currentWorkspace ? (
          <div className="dash-layout">
            <aside className="dash-form-panel">
              <DashboardQuickAdd onSaved={() => setRefreshKey(k => k + 1)} />
            </aside>
            <DashboardView key={`${currentWorkspace.id}-${refreshKey}`} workspaceId={currentWorkspace.id} />
          </div>
        ) : (
          <div className="board-empty-state">
            <ChartBar size={48} className="board-empty-icon" aria-hidden="true" />
            <h2 className="board-empty-title">No workspace selected</h2>
            <p className="board-empty-body">Select a workspace from the sidebar to view its dashboard.</p>
          </div>
        )}
      </main>
    </div>
  )
}
