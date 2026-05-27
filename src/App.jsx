import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { LabelsProvider } from './contexts/LabelsContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './components/auth/AuthPage'
import Board from './components/board/Board'
import AcceptInvitePage from './components/workspace/AcceptInvitePage'
import WorkspaceDeepLink from './components/workspace/WorkspaceDeepLink'
import ProjectDeepLink from './components/workspace/ProjectDeepLink'
import DashboardPage from './components/dashboard/DashboardPage'
import WritesPage from './components/writes/WritesPage'
import ToastContainer from './components/ui/ToastContainer'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen">Loading…</div>
  if (!user) return children

  // After login, honour redirect param (e.g. /invite/:token)
  const [params] = useSearchParams()
  const redirect = params.get('redirect')
  return <Navigate to={redirect ?? '/'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <LabelsProvider>
          <ProjectProvider>
          <Routes>
            <Route path="/login"          element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/invite/:token"        element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
            <Route path="/workspace/:workspaceId"                        element={<ProtectedRoute><WorkspaceDeepLink /></ProtectedRoute>} />
            <Route path="/workspace/:workspaceId/project/:projectId"  element={<ProtectedRoute><ProjectDeepLink /></ProtectedRoute>} />
            <Route path="/project/:projectId"                         element={<ProtectedRoute><ProjectDeepLink /></ProtectedRoute>} />
            <Route path="/dashboard"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/writes/:docId?"        element={<ProtectedRoute><WritesPage /></ProtectedRoute>} />
            <Route path="/"               element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
          </ProjectProvider>
          </LabelsProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
