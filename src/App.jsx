import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { ToastProvider } from './contexts/ToastContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AuthPage from './components/auth/AuthPage'
import Board from './components/board/Board'
import AcceptInvitePage from './components/workspace/AcceptInvitePage'
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
          <Routes>
            <Route path="/login"          element={<PublicRoute><AuthPage /></PublicRoute>} />
            <Route path="/invite/:token"  element={<ProtectedRoute><AcceptInvitePage /></ProtectedRoute>} />
            <Route path="/"               element={<ProtectedRoute><Board /></ProtectedRoute>} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </WorkspaceProvider>
      </AuthProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
