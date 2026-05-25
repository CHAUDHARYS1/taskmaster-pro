import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../helpers/renderWithProviders'

const switchProject = vi.fn()
const createProject = vi.fn(async () => ({ id: 'proj-new', name: 'New Project', color: '#2563EB' }))
const renameProject = vi.fn(async () => {})

const projects = [
  { id: 'proj-1', workspace_id: 'ws-1', name: 'General',  color: '#2563EB', position: 0 },
  { id: 'proj-2', workspace_id: 'ws-1', name: 'Marketing', color: '#16a34a', position: 1000 },
]

vi.mock('../../contexts/ProjectContext', () => ({
  useProject: () => ({
    projects,
    currentProject: projects[0],
    loading: false,
    switchProject,
    createProject,
    renameProject,
    removeProject: vi.fn(async () => {}),
  }),
}))
vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({ userRole: 'owner' }),
}))
vi.mock('../../contexts/ToastContext', async (importActual) => ({
  ...(await importActual()),
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))

import ProjectSwitcher from '../../components/workspace/ProjectSwitcher'

describe('ProjectSwitcher', () => {
  beforeEach(() => {
    switchProject.mockClear()
    createProject.mockClear()
  })

  it('renders all projects', () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
  })

  it('marks the active project', () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    const activeBtn = screen.getByText('General').closest('button')
    expect(activeBtn.className).toContain('project-item-btn--active')
  })

  it('calls switchProject when a project is clicked', () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    fireEvent.click(screen.getByText('Marketing').closest('button'))
    expect(switchProject).toHaveBeenCalledWith(projects[1])
  })

  it('shows create form when + is clicked', async () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /add project/i }))
    expect(screen.getByPlaceholderText('Project name…')).toBeInTheDocument()
  })

  it('calls createProject when form is submitted', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /add project/i }))
    await user.type(screen.getByPlaceholderText('Project name…'), 'New Project')
    fireEvent.click(screen.getByRole('button', { name: /^create$/i }))
    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Project' }))
    })
  })

  it('shows view mode icon on active project', () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    expect(screen.getByLabelText('board view')).toBeInTheDocument()
  })

  it('renders view toggle buttons in sidebar', () => {
    renderWithProviders(<ProjectSwitcher viewMode="board" onViewChange={() => {}} />)
    expect(screen.getByTitle('Board view (B)')).toBeInTheDocument()
    expect(screen.getByTitle('List view (L)')).toBeInTheDocument()
  })
})
