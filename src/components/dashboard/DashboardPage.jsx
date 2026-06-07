import { useState } from 'react'
import { List, Plus } from '@phosphor-icons/react'
import { useWorkspace } from '../../contexts/WorkspaceContext'
import Sidebar from '../layout/Sidebar'
import UtilityBar from '../layout/UtilityBar'
import DashboardView from './DashboardView'
import DashboardAddTaskModal from './DashboardAddTaskModal'

export default function DashboardPage() {
  const { currentWorkspace, loading } = useWorkspace()
  const [showSidebar,  setShowSidebar]  = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    localStorage.getItem('tm_sidebar_collapsed') === 'true'
  )
  const [refreshKey,   setRefreshKey]   = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)

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
      <Sidebar isOpen={showSidebar} collapsed={sidebarCollapsed} onToggleCollapse={handleToggleSidebar} />

      <main className="board-main">
        <UtilityBar />
        <div className="board-header">
          <div className="board-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setShowSidebar(p => !p)}
              aria-label="Toggle sidebar"
            >
              <List size={22} aria-hidden="true" />
            </button>
            <span className="board-header-title">Dashboard</span>
          </div>
        </div>

        <DashboardView key={refreshKey} />
      </main>

      {currentWorkspace && (
        <button
          className="dash-fab"
          onClick={() => setShowAddModal(true)}
          aria-label="Add new task"
          title="Add new task"
        >
          <Plus size={22} weight="bold" aria-hidden="true" />
        </button>
      )}

      {showAddModal && (
        <DashboardAddTaskModal
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setRefreshKey(k => k + 1)
            setShowAddModal(false)
          }}
        />
      )}
    </div>
  )
}
