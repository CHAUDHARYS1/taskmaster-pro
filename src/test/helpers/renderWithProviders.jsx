import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../contexts/ToastContext'
import { ThemeProvider } from '../../contexts/ThemeContext'

// Lightweight wrapper: only real providers that have no Supabase dependency.
// All Supabase-backed contexts (Auth, Workspace, Project, Labels) are mocked
// at the module level in each test file via vi.mock.
export function renderWithProviders(ui) {
  function Wrapper({ children }) {
    return (
      <MemoryRouter>
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
  }
  return render(ui, { wrapper: Wrapper })
}

// Shared default stubs — import and spread in vi.mock factories
export const defaultAuth = {
  user:          { id: 'user-1', email: 'test@example.com' },
  profile:       { first_name: 'Test', last_name: 'User', email: 'test@example.com', avatar_url: null },
  loading:       false,
  displayName:   'Test User',
  signOut:       () => {},
  updateProfile: async () => {},
  uploadAvatar:  async () => {},
}

export const defaultWorkspace = {
  workspaces:              [{ id: 'ws-1', name: 'My Workspace', owner_id: 'user-1', auto_save: true }],
  currentWorkspace:        { id: 'ws-1', name: 'My Workspace', owner_id: 'user-1', auto_save: true },
  userRole:                'owner',
  loading:                 false,
  autoSave:                true,
  switchWorkspace:         () => {},
  createWorkspace:         async () => {},
  renameWorkspace:         async () => {},
  deleteWorkspace:         async () => {},
  updateWorkspaceSettings: async () => {},
  refetch:                 () => {},
}

export const defaultProject = {
  projects:       [{ id: 'proj-1', workspace_id: 'ws-1', name: 'General', color: '#2563EB', position: 0 }],
  currentProject: { id: 'proj-1', workspace_id: 'ws-1', name: 'General', color: '#2563EB', position: 0 },
  loading:        false,
  switchProject:  () => {},
  createProject:  async () => {},
  renameProject:  async () => {},
  removeProject:  async () => {},
}

export const defaultLabels = {
  labels:      [],
  labelMap:    {},
  loading:     false,
  addLabel:    async () => {},
  deleteLabel: async () => {},
}
