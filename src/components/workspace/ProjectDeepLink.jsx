import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function ProjectDeepLink() {
  const { projectId }                            = useParams()
  const { workspaces, loading, switchWorkspace } = useWorkspace()
  const navigate                                 = useNavigate()
  const ran                                      = useRef(false)

  useEffect(() => {
    if (loading || ran.current) return
    ran.current = true

    const run = async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('id, workspace_id')
        .eq('id', projectId)
        .single()

      if (project) {
        const ws = workspaces.find(w => w.id === project.workspace_id)
        if (ws) {
          // Pre-select this project so ProjectContext picks it up on workspace load
          localStorage.setItem(`tm_last_project_${ws.id}`, project.id)
          switchWorkspace(ws)
        }
      }

      navigate('/app', { replace: true })
    }

    run()
  }, [loading, projectId, workspaces, switchWorkspace, navigate])

  return <div className="loading-screen">Loading…</div>
}
