import { useWorkspace } from '../../contexts/WorkspaceContext'

export default function UtilityBar() {
  const { currentWorkspace } = useWorkspace()
  const color = currentWorkspace?.color ?? 'var(--accent)'

  return (
    <div
      className="utility-bar"
      style={{ background: color }}
      aria-hidden="true"
    />
  )
}
