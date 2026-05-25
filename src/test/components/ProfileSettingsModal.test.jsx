import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../helpers/renderWithProviders'

const updateProfile = vi.fn(async () => {})
const uploadAvatar  = vi.fn(async () => 'https://example.com/avatar.jpg')

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user:          { id: 'user-1', email: 'test@example.com' },
    profile:       { first_name: 'Jane', last_name: 'Smith', email: 'test@example.com', avatar_url: null },
    updateProfile,
    uploadAvatar,
  }),
}))
vi.mock('../../contexts/ToastContext', async (importActual) => ({
  ...(await importActual()),
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))
vi.mock('../../lib/supabase', () => ({
  supabase: { storage: { from: vi.fn(() => ({ upload: vi.fn(async () => ({ error: null })), getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })) })) } },
}))

import ProfileSettingsModal from '../../components/ui/ProfileSettingsModal'

describe('ProfileSettingsModal', () => {
  const onClose = vi.fn()

  beforeEach(() => { updateProfile.mockClear(); uploadAvatar.mockClear(); onClose.mockClear() })

  it('renders with prefilled name fields', () => {
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
  })

  it('renders email field as disabled', () => {
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled()
  })

  it('shows initials avatar when no avatar_url', () => {
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    expect(screen.getByText('J')).toBeInTheDocument() // first initial of "Jane"
  })

  it('calls updateProfile with trimmed values on submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    const firstInput = screen.getByDisplayValue('Jane')
    await user.clear(firstInput)
    await user.type(firstInput, 'Alice ')
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({ first_name: 'Alice', last_name: 'Smith' })
    })
  })

  it('calls onClose after successful save', async () => {
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => { expect(onClose).toHaveBeenCalled() })
  })

  it('cancels without saving when Cancel is clicked', () => {
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(updateProfile).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('rejects files over 2 MB', async () => {
    const errorToast = vi.fn()
    vi.mocked((await import('../../contexts/ToastContext')).useToast)
    renderWithProviders(<ProfileSettingsModal onClose={onClose} />)
    const input = document.querySelector('.avatar-file-input')
    const bigFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(bigFile, 'size', { value: 3 * 1024 * 1024 })
    fireEvent.change(input, { target: { files: [bigFile] } })
    expect(uploadAvatar).not.toHaveBeenCalled()
  })
})
