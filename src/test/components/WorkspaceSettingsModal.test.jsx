import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'

const updateWorkspaceSettings = vi.fn(async () => {})

vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    currentWorkspace: { id: 'ws-1', name: 'My Workspace' },
    autoSave: false,
    updateWorkspaceSettings,
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
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} />)
    expect(screen.getByText('Workspace Settings')).toBeInTheDocument()
    expect(screen.getByText('Auto-save task edits')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /toggle auto-save/i })).toBeInTheDocument()
  })

  it('toggle reflects autoSave=false (off state)', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} />)
    const btn = screen.getByRole('button', { name: /toggle auto-save/i })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    expect(btn.className).not.toContain('toggle-btn--on')
  })

  it('calls updateWorkspaceSettings with inverted value on toggle click', async () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /toggle auto-save/i }))
    await waitFor(() => {
      expect(updateWorkspaceSettings).toHaveBeenCalledWith('ws-1', { auto_save: true })
    })
  })

  it('closes when backdrop is clicked', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} />)
    fireEvent.click(document.querySelector('.modal-overlay'))
    expect(onClose).toHaveBeenCalled()
  })

  it('closes when × button is clicked', () => {
    renderWithProviders(<WorkspaceSettingsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
