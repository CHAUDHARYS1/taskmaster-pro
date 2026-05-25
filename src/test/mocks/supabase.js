import { vi } from 'vitest'

// Chainable query builder mock
function makeQuery(resolveWith = { data: [], error: null }) {
  const q = {
    select:  vi.fn(() => q),
    insert:  vi.fn(() => q),
    update:  vi.fn(() => q),
    delete:  vi.fn(() => q),
    upsert:  vi.fn(() => q),
    eq:      vi.fn(() => q),
    neq:     vi.fn(() => q),
    order:   vi.fn(() => q),
    single:  vi.fn(() => Promise.resolve(resolveWith)),
    then:    (res) => Promise.resolve(resolveWith).then(res),
  }
  return q
}

export const supabase = {
  from:    vi.fn(() => makeQuery()),
  rpc:     vi.fn(() => Promise.resolve({ data: null, error: null })),
  channel: vi.fn(() => ({
    on:        vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => { cb?.('SUBSCRIBED'); return {} }),
    track:     vi.fn(),
  })),
  removeChannel: vi.fn(),
  auth: {
    getSession:        vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signInWithPassword: vi.fn(),
    signUp:            vi.fn(),
    signOut:           vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload:       vi.fn(() => Promise.resolve({ error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
    })),
  },
}

vi.mock('../../lib/supabase', () => ({ supabase }))
