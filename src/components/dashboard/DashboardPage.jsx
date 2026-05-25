import { useState } from 'react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import DashboardView from './DashboardView'

export default function DashboardPage() {
  const { currentWorkspace, loading } = useWorkspace()
  const [showSidebar, setShowSidebar] = useState(false)

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
              ☰
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
          <DashboardView workspaceId={currentWorkspace.id} />
        ) : (
          <div className="board-empty-state">
            <p className="board-empty-icon" aria-hidden="true">📊</p>
            <h2 className="board-empty-title">No workspace selected</h2>
            <p className="board-empty-body">Select a workspace from the sidebar to view its dashboard.</p>
          </div>
        )}
      </main>
    </div>
  )
}
