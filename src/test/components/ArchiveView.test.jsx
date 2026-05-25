import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'

const restoreTask  = vi.fn(async () => {})
const deleteArchive = vi.fn(async () => {})
const archiveNow   = vi.fn(async () => 3)

const archives = [
  {
    id: 'arch-1',
    workspace_id: 'ws-1',
    text: 'Write unit tests',
    status: 'done',
    priority: 'high',
    labels: [],
    due_date: null,
    assignee: null,
    archived_at: new Date('2025-05-20T21:00:00Z').toISOString(),
    created_at: new Date('2025-05-10').toISOString(),
  },
  {
    id: 'arch-2',
    workspace_id: 'ws-1',
    text: 'Deploy to production',
    status: 'done',
    priority: null,
    labels: [],
    due_date: '2025-05-15',
    assignee: { email: 'alice@example.com', first_name: 'Alice', last_name: 'Smith' },
    archived_at: new Date('2025-05-20T21:00:00Z').toISOString(),
    created_at: new Date('2025-05-12').toISOString(),
  },
]

vi.mock('../../hooks/useArchive', () => ({
  useArchive: () => ({ archives, loading: false, restoreTask, deleteArchive, archiveNow }),
}))
vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({ currentWorkspace: { id: 'ws-1' } }),
}))
vi.mock('../../contexts/ToastContext', async (importActual) => ({
  ...(await importActual()),
  useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }),
}))

import ArchiveView from '../../components/board/ArchiveView'

describe('ArchiveView', () => {
  beforeEach(() => {
    restoreTask.mockClear()
    deleteArchive.mockClear()
    archiveNow.mockClear()
  })

  it('renders archived task titles', () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    expect(screen.getByText('Write unit tests')).toBeInTheDocument()
    expect(screen.getByText('Deploy to production')).toBeInTheDocument()
  })

  it('shows assignee name when present', () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument()
  })

  it('shows due date when present', () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    expect(screen.getByText(/due May 15/)).toBeInTheDocument()
  })

  it('renders Restore buttons for editors', () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    expect(screen.getAllByRole('button', { name: /restore/i })).toHaveLength(2)
  })

  it('calls restoreTask on Restore click', async () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    fireEvent.click(screen.getAllByRole('button', { name: /restore/i })[0])
    await waitFor(() => {
      expect(restoreTask).toHaveBeenCalledWith('arch-1')
    })
  })

  it('calls deleteArchive on × click after confirm', async () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    fireEvent.click(screen.getAllByRole('button', { name: /permanently delete/i })[0])
    await waitFor(() => {
      expect(deleteArchive).toHaveBeenCalledWith('arch-1')
    })
  })

  it('calls archiveNow when "Archive done tasks now" is clicked', async () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    fireEvent.click(screen.getByRole('button', { name: /archive done tasks now/i }))
    await waitFor(() => {
      expect(archiveNow).toHaveBeenCalled()
    })
  })

  it('hides archive-now button for non-owners', () => {
    renderWithProviders(<ArchiveView canEdit={true} canDelete={false} />)
    expect(screen.queryByRole('button', { name: /archive done tasks now/i })).toBeNull()
  })

  it('hides restore button for viewers', () => {
    renderWithProviders(<ArchiveView canEdit={false} canDelete={false} />)
    expect(screen.queryByRole('button', { name: /restore/i })).toBeNull()
  })

  it('renders the archive title heading', () => {
    renderWithProviders(<ArchiveView canEdit canDelete />)
    expect(screen.getByRole('heading', { name: /archive/i })).toBeInTheDocument()
  })
})
