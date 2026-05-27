import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const TIMEOUT_MS  = 3 * 60 * 60 * 1000  // 3 hours
const CHECK_MS    = 60 * 1000            // poll every minute
const EVENTS      = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

export default function SessionGuard() {
  const { user, signOut } = useAuth()
  const navigate          = useNavigate()
  const lastActivity      = useRef(Date.now())

  useEffect(() => {
    if (!user) return

    const bump = () => { lastActivity.current = Date.now() }
    EVENTS.forEach(e => window.addEventListener(e, bump, { passive: true }))

    const timer = setInterval(async () => {
      if (Date.now() - lastActivity.current >= TIMEOUT_MS) {
        clearInterval(timer)
        await signOut()
        navigate('/login?reason=timeout', { replace: true })
      }
    }, CHECK_MS)

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, bump))
      clearInterval(timer)
    }
  }, [user, signOut, navigate])

  return null
}
