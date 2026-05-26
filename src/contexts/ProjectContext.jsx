import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useWorkspace } from './WorkspaceContext'
import { useProjects } from '../hooks/useProjects'

const ProjectContext = createContext(null)

export function ProjectProvider({ children }) {
  const { currentWorkspace } = useWorkspace()
  const { projects, loading, addProject, renameProject, deleteProject } =
    useProjects(currentWorkspace?.id)

  const [currentProject, setCurrentProject] = useState(null)

  // When workspace changes, pick the right project (or global board)
  useEffect(() => {
    if (!currentWorkspace?.id || loading) return
    const storageKey = `tm_last_project_${currentWorkspace.id}`
    const lastId = localStorage.getItem(storageKey)
    if (lastId === '__global__') { setCurrentProject(null); return }
    if (projects.length === 0) return
    setCurrentProject(
      (lastId && projects.find(p => p.id === lastId)) ?? projects[0] ?? null
    )
  }, [currentWorkspace?.id, loading, projects])

  const switchProject = useCallback((project) => {
    if (!currentWorkspace?.id) return
    const storageKey = `tm_last_project_${currentWorkspace.id}`
    if (!project) {
      localStorage.setItem(storageKey, '__global__')
      setCurrentProject(null)
      return
    }
    localStorage.setItem(storageKey, project.id)
    setCurrentProject(project)
  }, [currentWorkspace?.id])

  const createProject = useCallback(async ({ name, color }) => {
    const project = await addProject({ name, color })
    setCurrentProject(project)
    if (currentWorkspace?.id)
      localStorage.setItem(`tm_last_project_${currentWorkspace.id}`, project.id)
    return project
  }, [addProject, currentWorkspace?.id])

  const removeProject = useCallback(async (id) => {
    await deleteProject(id)
    if (currentProject?.id === id) {
      const remaining = projects.filter(p => p.id !== id)
      const fallback  = remaining[0] ?? null
      setCurrentProject(fallback)
      if (currentWorkspace?.id) {
        localStorage.setItem(
          `tm_last_project_${currentWorkspace.id}`,
          fallback ? fallback.id : '__global__'
        )
      }
    }
  }, [currentProject, projects, deleteProject, currentWorkspace?.id])

  const patchProject = useCallback(async (id, name, extra = {}) => {
    await renameProject(id, name, extra)
    if (currentProject?.id === id)
      setCurrentProject(prev => prev ? { ...prev, name: name.trim(), ...extra } : prev)
  }, [renameProject, currentProject])

  return (
    <ProjectContext.Provider value={{
      projects, currentProject, loading,
      switchProject, createProject, renameProject: patchProject, removeProject,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
