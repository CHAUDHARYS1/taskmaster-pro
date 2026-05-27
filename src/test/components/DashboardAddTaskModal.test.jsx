import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'

const mockWorkspaces = [
  { id: 'ws-1', name: 'Workspace One' },
  { id: 'ws-2', name: 'Workspace Two' },
]

const mockProjects = [
  { id: 'proj-1', name: 'Project Alpha', workspace_id: 'ws-1' },
]

vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    workspaces: mockWorkspaces,
    currentWorkspace: mockWorkspaces[0],
  }),
}))

vi.mock('../../hooks/useProjects', () => ({
  useProjects: (workspaceId) => ({
    projects: workspaceId === 'ws-1' ? mockProjects : [],
    loading: false,
  }),
}))

const mockInsert = vi.fn(() => Promise.resolve({ error: null }))
const mockSelect = vi.fn(() => ({
  eq: vi.fn(() => ({
    eq: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [{ position: 1000 }] })),
        })),
      })),
    })),
  })),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => {
      if (table === 'tasks') {
        return {
          select: mockSelect,
          insert: mockInsert,
        }
      }
      return {}
    }),
  },
}))

import DashboardAddTaskModal from '../../components/dashboard/DashboardAddTaskModal'

describe('DashboardAddTaskModal', () => {
  const onClose = vi.fn()
  const onSaved = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with correct title and close button', () => {
    renderWithProviders(<DashboardAddTaskModal onClose={onClose} onSaved={onSaved} />)
    expect(screen.getByText('Add New Task')).toBeInTheDocument()
  })

  it('displays default workspace and projects if workspace has projects', () => {
    renderWithProviders(<DashboardAddTaskModal onClose={onClose} onSaved={onSaved} />)
    expect(screen.getByLabelText(/Workspace/i)).toHaveValue('ws-1')
  })

  it('requires workspace selection and displays error', async () => {
    renderWithProviders(<DashboardAddTaskModal onClose={onClose} onSaved={onSaved} />)
    
    // Change workspace to empty
    fireEvent.change(screen.getByLabelText(/Workspace/i), { target: { value: '' } })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Save Task/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please select a workspace.')).toBeInTheDocument()
    })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('requires project selection and displays error', async () => {
    renderWithProviders(<DashboardAddTaskModal onClose={onClose} onSaved={onSaved} />)
    
    // Set workspace to ws-1 (which has projects, but projectId starts empty)
    // Verify project select is empty
    expect(screen.getByLabelText(/Project/i)).toHaveValue('')
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Save Task/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Please select a project.')).toBeInTheDocument()
    })
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('successfully submits task with title, status and due date', async () => {
    renderWithProviders(<DashboardAddTaskModal onClose={onClose} onSaved={onSaved} />)
    
    // Set project
    fireEvent.change(screen.getByLabelText(/Project/i), { target: { value: 'proj-1' } })
    
    // Change title
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: 'My New Task' } })
    
    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Save Task/i }))
    
    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          workspace_id: 'ws-1',
          project_id: 'proj-1',
          text: 'My New Task',
        })
      )
      expect(onSaved).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
