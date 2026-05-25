import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

import PresenceAvatars from '../../components/board/PresenceAvatars'

const make = (overrides = {}) => ({
  user_id:      'user-2',
  email:        'alice@example.com',
  display_name: 'Alice Smith',
  avatar_url:   null,
  last_seen:    new Date().toISOString(),
  ...overrides,
})

describe('PresenceAvatars', () => {
  it('renders nothing when fewer than 2 users', () => {
    const { container } = render(<PresenceAvatars users={[make()]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when users is empty', () => {
    const { container } = render(<PresenceAvatars users={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders initials avatar when no avatar_url', () => {
    const users = [make(), make({ user_id: 'user-3', display_name: 'Bob Jones', email: 'bob@example.com' })]
    render(<PresenceAvatars users={users} />)
    expect(screen.getByText('AS')).toBeInTheDocument()
    expect(screen.getByText('BJ')).toBeInTheDocument()
  })

  it('renders an img when avatar_url is set', () => {
    const users = [
      make({ avatar_url: 'https://cdn.example.com/avatar.jpg' }),
      make({ user_id: 'user-3', email: 'bob@example.com' }),
    ]
    render(<PresenceAvatars users={users} />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('shows overflow count when more than 4 users', () => {
    const users = Array.from({ length: 6 }, (_, i) =>
      make({ user_id: `u-${i}`, email: `u${i}@x.com`, display_name: `User ${i}` })
    )
    render(<PresenceAvatars users={users} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('shows tooltip with name and email on click', async () => {
    const user = userEvent.setup()
    const users = [
      make({ user_id: 'user-1', display_name: 'Test User', email: 'test@example.com' }),
      make({ user_id: 'user-2' }),
    ]
    render(<PresenceAvatars users={users} />)
    const wrap = document.querySelectorAll('.presence-avatar-wrap')[0]
    await user.click(wrap)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('marks the current user with (you)', async () => {
    const user = userEvent.setup()
    const users = [
      make({ user_id: 'user-1', display_name: 'Me', email: 'me@example.com' }),
      make({ user_id: 'user-2' }),
    ]
    render(<PresenceAvatars users={users} />)
    const wraps = document.querySelectorAll('.presence-avatar-wrap')
    await user.click(wraps[0])
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })
})
