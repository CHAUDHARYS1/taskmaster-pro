import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { LabelsProvider } from './contexts/LabelsContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import SessionGuard from './components/auth/SessionGuard'
import ToastContainer from './components/ui/ToastContainer'

const AuthPage        = lazy(() => import('./components/auth/AuthPage'))
const Board           = lazy(() => import('./components/board/Board'))
const AcceptInvitePage  = lazy(() => import('./components/workspace/AcceptInvitePage'))
const WorkspaceDeepLink = lazy(() => import('./components/workspace/WorkspaceDeepLink'))
const ProjectDeepLink   = lazy(() => import('./components/workspace/ProjectDeepLink'))
const DashboardPage   = lazy(() => import('./components/dashboard/DashboardPage'))
const WritesPage      = lazy(() => import('./components/writes/WritesPage'))
const CalendarPage    = lazy(() => import('./components/calendar/CalendarPage'))

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
  return <Navigate to={redirect ?? '/app'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
    <ToastProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <LabelsProvider>
          <ProjectProvider>
          <SessionGuard />
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Suspense fallback={<div className="loading-screen">Loading…</div>}>
          <Routes>
            <Route path="/login"          element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/invite/:token"        element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
            <Route path="/workspace/:workspaceId"                        element={<ProtectedRoute><WorkspaceDeepLink /></ProtectedRoute>} />
            <Route path="/workspace/:workspaceId/project/:projectId"  element={<ProtectedRoute><ProjectDeepLink /></ProtectedRoute>} />
            <Route path="/project/:projectId"                         element={<ProtectedRoute><ProjectDeepLink /></ProtectedRoute>} />
            <Route path="/dashboard"             element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/calendar"              element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/writes/:docId?"        element={<ProtectedRoute><WritesPage /></ProtectedRoute>} />
            <Route path="/app"            element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="/"               element={<LandingPage />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <ToastContainer />
          </ProjectProvider>
          </LabelsProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
