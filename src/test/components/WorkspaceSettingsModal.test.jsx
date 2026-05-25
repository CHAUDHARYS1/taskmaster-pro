import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'

const updateWorkspaceSettings = vi.fn(async () => {})

vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    currentWorkspace: { id: 'ws-1', name: 'My Workspace' },
    autoSave: false,
    userRole: 'owner',
    updateWorkspaceSettings,
    deleteWorkspace: vi.fn(async () => {}),
  }),
}))
vi.mock('../../contexts/ProjectContext', () => ({
  useProject: () => ({
    projects: [{ id: 'proj-1', name: 'General', color: '#2563EB', enabled_columns: null }],
    currentProject: { id: 'proj-1', name: 'General', color: '#2563EB', enabled_columns: null },
    removeProject: vi.fn(async () => {}),
    renameProject: vi.fn(async () => {}),
  }),
}))
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'owner@example.com' } }),
}))
vi.mock('../../hooks/useMembers', () => ({
  useMembers: () => ({
    members: [
      { user_id: 'user-1', email: 'owner@example.com', first_name: 'Jane', last_name: 'Doe', role: 'owner' },
    ],
    inviteMember: vi.fn(async () => ({ token: 'abc123' })),
    removeMember: vi.fn(async () => {}),
  }),
}))
vi.mock('../../contexts/ToastContext', async (importActual) => ({
  ...(await importActual()),
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))

import WorkspaceSettingsModal from '../../components/workspace/WorkspaceSettingsModal'

describe('WorkspaceSettingsModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    updateWorkspaceSettings.mockClear()
    onClose.mockClear()
  })

  it('renders the modal with auto-save toggle', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} canEdit canDelete />)
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument()
    expect(screen.getByText('Auto-save task edits')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle auto-save/i })).toBeInTheDocument()
  })

  it('toggle reflects autoSave=false (off state)', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} canEdit canDelete />)
    const btn = screen.getByRole('button', { name: /toggle auto-save/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).not.toContain('toggle-btn--on')
  })

  it('calls updateWorkspaceSettings with inverted value on toggle click', async () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} canEdit canDelete />)
    fireEvent.click(screen.getByRole('button', { name: /toggle auto-save/i }))
    await waitFor(() => {
      expect(updateWorkspaceSettings).toHaveBeenCalledWith('ws-1', { auto_save: true })
    })
  })

  it('closes when backdrop is clicked', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} canEdit canDelete />)
    fireEvent.click(document.querySelector('.modal-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when × button is clicked', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} canEdit canDelete />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
