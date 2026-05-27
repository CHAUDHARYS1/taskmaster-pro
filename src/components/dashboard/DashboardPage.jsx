import { useState } from 'react'
import { List, ChartBar, Plus } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import DashboardView from './DashboardView'
import DashboardAddTaskModal from './DashboardAddTaskModal'

export default function DashboardPage() {
  const { currentWorkspace, loading } = useWorkspace()
  const [showSidebar,  setShowSidebar]  = useState(false)
  const [showAddTask,  setShowAddTask]  = useState(false)
  const [refreshKey,   setRefreshKey]   = useState(0)

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
          <div className="board-header-right">
            <button className="btn-primary" onClick={() => setShowAddTask(true)}>
              <Plus size={16} weight="bold" aria-hidden="true" />
              Add Task
            </button>
          </div>
        </div>

        {currentWorkspace ? (
          <DashboardView key={`${currentWorkspace.id}-${refreshKey}`} workspaceId={currentWorkspace.id} />
        ) : (
          <div className="board-empty-state">
            <ChartBar size={48} className="board-empty-icon" aria-hidden="true" />
            <h2 className="board-empty-title">No workspace selected</h2>
            <p className="board-empty-body">Select a workspace from the sidebar to view its dashboard.</p>
          </div>
        )}
      </main>

      {showAddTask && (
        <DashboardAddTaskModal
          onClose={() => setShowAddTask(false)}
          onSaved={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  )
}
