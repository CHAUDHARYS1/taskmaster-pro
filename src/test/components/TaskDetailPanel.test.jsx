import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../helpers/renderWithProviders'

const onUpdate = vi.fn(async () => {})
const onClose  = vi.fn()

const task = {
  id: 'task-1',
  workspace_id: 'ws-1',
  project_id: 'proj-1',
  text: 'Build the feature',
  description: 'A detailed description',
  status: 'toDo',
  priority: 'high',
  labels: [],
  assignee_id: null,
  assignee: null,
  due_date: null,
  created_at: new Date('2025-01-01').toISOString(),
}

vi.mock('../../contexts/AuthContext',    () => ({ useAuth:      () => ({ user: { id: 'user-1' }, profile: null }) }))
vi.mock('../../contexts/WorkspaceContext', () => ({ useWorkspace: () => ({ currentWorkspace: { id: 'ws-1' } }) }))
vi.mock('../../contexts/ToastContext', async (importActual) => ({ ...(await importActual()), useToast: () => ({ toast: { success: vi.fn(), error: vi.fn() } }) }))
vi.mock('../../contexts/LabelsContext',  () => ({ useLabelsCtx: () => ({ labels: [], labelMap: {} }) }))
vi.mock('../../hooks/useTaskDetail', () => ({
  useTaskDetail: () => ({
    comments: [],
    loading: false,
    addComment:    vi.fn(async () => {}),
    deleteComment: vi.fn(async () => {}),
    updateComment: vi.fn(async () => {}),
  }),
}))
vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn(() => ({ select: vi.fn(() => ({ eq: vi.fn(() => ({ then: vi.fn() })) })) })) },
}))

import TaskDetailPanel from '../../components/board/TaskDetailPanel'

describe('TaskDetailPanel — auto-save mode', () => {
  beforeEach(() => { onUpdate.mockClear(); onClose.mockClear() })

  it('renders the task title', () => {
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave onUpdate={onUpdate} onClose={onClose} />)
    expect(screen.getByDisplayValue('Build the feature')).toBeInTheDocument()
  })

  it('renders the description', () => {
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave onUpdate={onUpdate} onClose={onClose} />)
    expect(screen.getByDisplayValue('A detailed description')).toBeInTheDocument()
  })

  it('calls onUpdate when status changes', () => {
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave onUpdate={onUpdate} onClose={onClose} />)
    fireEvent.change(screen.getByRole('combobox', { name: /task status/i }), {
      target: { value: 'inProgress' },
    })
    expect(onUpdate).toHaveBeenCalledWith('task-1', { status: 'inProgress' })
  })

  it('saves title on blur in auto-save mode', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave onUpdate={onUpdate} onClose={onClose} />)
    const titleInput = screen.getByDisplayValue('Build the feature')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated title')
    await user.tab()
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('task-1', { text: 'Updated title' })
    })
  })
})

describe('TaskDetailPanel — manual save mode', () => {
  beforeEach(() => { onUpdate.mockClear(); onClose.mockClear() })

  it('does not call onUpdate on title blur when autoSave is false', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave={false} onUpdate={onUpdate} onClose={onClose} />)
    const titleInput = screen.getByDisplayValue('Build the feature')
    await user.clear(titleInput)
    await user.type(titleInput, 'Draft title')
    await user.tab()
    expect(onUpdate).not.toHaveBeenCalledWith('task-1', expect.objectContaining({ text: expect.any(String) }))
  })

  it('shows Save button when there are pending changes', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave={false} onUpdate={onUpdate} onClose={onClose} />)
    const titleInput = screen.getByDisplayValue('Build the feature')
    await user.clear(titleInput)
    await user.type(titleInput, 'Draft title')
    expect(screen.getByRole('button', { name: /^save$/i })).toBeInTheDocument()
  })

  it('calls onUpdate with pending changes when Save is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave={false} onUpdate={onUpdate} onClose={onClose} />)
    const titleInput = screen.getByDisplayValue('Build the feature')
    await user.clear(titleInput)
    await user.type(titleInput, 'Draft title')
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(onUpdate).toHaveBeenCalledWith('task-1', expect.objectContaining({ text: 'Draft title' }))
  })

  it('does not show Save button when nothing has changed', () => {
    renderWithProviders(<TaskDetailPanel task={task} canEdit autoSave={false} onUpdate={onUpdate} onClose={onClose} />)
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull()
  })
})
