import { useAuth } from '../../contexts/AuthContext'
import LogoLockup from '../ui/LogoLockup'
import Spinner from '../ui/Spinner'

export default function AuthTransitionOverlay() {
  const { signingOut } = useAuth()
  if (!signingOut) return null

  return (
    <div className="auth-transition-overlay" role="status" aria-label="Signing out">
      <LogoLockup width={148} />
      <div className="auth-transition-status">
        <Spinner size={15} />
        <span>Signing out…</span>
      </div>
    </div>
  )
}
