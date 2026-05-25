import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function AcceptInvitePage() {
  const { token }                  = useParams()
  const { user, loading: authLoading } = useAuth()
  const { refetch, switchWorkspace } = useWorkspace()
  const navigate                   = useNavigate()

  const [status, setStatus] = useState('idle') // idle | accepting | success | error
  const [error, setError]   = useState('')
  const acceptedRef = useRef(false)

  useEffect(() => {
    // Wait for auth to resolve
    if (authLoading) return

    // Not logged in — send to login, then back here
    if (!user) {
      navigate(`/login?redirect=/invite/${token}`, { replace: true })
      return
    }

    // Guard against double-invocation (unstable context refs cause re-runs)
    if (acceptedRef.current) return
    acceptedRef.current = true

    // Logged in — accept the invitation
    const accept = async () => {
      setStatus('accepting')
      const { data, error } = await supabase.rpc('accept_invitation', { invite_token: token })

      if (error) {
        setStatus('error')
        setError(error.message)
        return
      }

      // Refresh workspaces and switch to the newly joined one
      await refetch()
      if (data?.workspace_id) {
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', data.workspace_id)
          .single()
        if (ws) switchWorkspace(ws)
      }

      setStatus('success')
      setTimeout(() => navigate('/', { replace: true }), 1500)
    }

    accept()
  }, [user, authLoading, token, navigate, refetch, switchWorkspace])

  if (authLoading || status === 'idle' || status === 'accepting') {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-status">Joining workspace…</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <p className="invite-status invite-status--success">✓ You've joined the workspace! Redirecting…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="invite-page">
      <div className="invite-card">
        <p className="invite-status invite-status--error">Could not accept invitation</p>
        <p className="invite-error-msg">{error}</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Go to board</button>
      </div>
    </div>
  )
}
