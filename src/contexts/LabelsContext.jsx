import { createContext, useContext, useMemo } from 'react'
import { useWorkspace } from './WorkspaceContext'
import { useLabels } from '../hooks/useLabels'

const LabelsContext = createContext(null)

export function LabelsProvider({ children }) {
  const { currentWorkspace } = useWorkspace()
  const { labels, loading, addLabel, deleteLabel } = useLabels(currentWorkspace?.id)

  // Derive a fast id→label lookup map
  const labelMap = useMemo(
    () => Object.fromEntries(labels.map(l => [l.id, l])),
    [labels]
  )

  return (
    <LabelsContext.Provider value={{ labels, labelMap, loading, addLabel, deleteLabel }}>
      {children}
    </LabelsContext.Provider>
  )
}

export function useLabelsCtx() {
  const ctx = useContext(LabelsContext)
  if (!ctx) throw new Error('useLabelsCtx must be used within LabelsProvider')
  return ctx
}
