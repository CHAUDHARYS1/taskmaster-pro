import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'

const mockWorkspace = {
  workspaces: [{ id: 'ws-1', name: 'My Test Workspace' }],
  currentWorkspace: { id: 'ws-1', name: 'My Test Workspace' },
  loading: false,
}

vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => mockWorkspace,
}))

vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => ({
    data: {
      stats: { totalTasks: 5, totalCompleted: 2, completedToday: 1, completedThisWeek: 1, completedThisMonth: 1, overdue: 0 },
      streak: { current: 1, longest: 1 },
      heatmap: [],
      statusBreakdown: { toDo: 1, inProgress: 1, inReview: 1, done: 2 },
      recentCompletions: [],
    },
    loading: false,
    error: null,
  }),
}))

vi.mock('../../hooks/useProjects', () => ({
  useProjects: () => ({
    projects: [{ id: 'p-1', name: 'Proj 1' }],
    loading: false,
  }),
}))

vi.mock('../../contexts/ProjectContext', () => ({
  useProject: () => ({
    projects: [{ id: 'p-1', name: 'Proj 1' }],
    loading: false,
    switchProject: vi.fn(),
  }),
}))

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'u-1', email: 'test@example.com' },
    profile: null,
    displayName: 'Test User',
    signOut: vi.fn(),
  }),
}))

import DashboardPage from '../../components/dashboard/DashboardPage'

describe('DashboardPage', () => {
  it('renders workspace title and Add Task button', () => {
    renderWithProviders(<DashboardPage />)
    expect(screen.getByText('My Test Workspace /')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Task/i })).toBeInTheDocument()
  })

  it('opens and closes Add Task Modal', async () => {
    renderWithProviders(<DashboardPage />)
    
    // Modal shouldn't be open initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    
    // Click Add Task button
    fireEvent.click(screen.getByRole('button', { name: /Add Task/i }))
    
    // Modal should render
    expect(screen.getByRole('dialog', { name: /Add new task/i })).toBeInTheDocument()
    
    // Click cancel in the modal to close it
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    
    // Modal should close
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
