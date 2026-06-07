import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function WorkspaceDeepLink() {
  const { workspaceId }              = useParams()
  const { workspaces, loading, switchWorkspace } = useWorkspace()
  const navigate                     = useNavigate()

  useEffect(() => {
    if (loading) return
    const ws = workspaces.find(w => w.id === workspaceId)
    if (ws) switchWorkspace(ws)
    navigate('/app', { replace: true })
  }, [loading, workspaces, workspaceId, switchWorkspace, navigate])

  return <div className="loading-screen">Loading…</div>
}
