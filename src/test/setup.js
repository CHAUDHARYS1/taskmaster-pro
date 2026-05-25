import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Suppress console.error noise from React in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })

// Mock window.matchMedia (used by ThemeContext)
window.matchMedia = vi.fn(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Mock window.AudioContext (used by playDoneSound in Board)
window.AudioContext = vi.fn(() => ({
  createOscillator: vi.fn(() => ({ connect: vi.fn(), start: vi.fn(), stop: vi.fn(), type: '', frequency: { value: 0 } })),
  createGain:       vi.fn(() => ({ connect: vi.fn(), gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() } })),
  destination: {},
  currentTime: 0,
}))

// Mock window.confirm (used by delete confirmations)
window.confirm = vi.fn(() => true)

// Mock localStorage
const localStorageMock = (() => {
  let store = {}
  return {
    getItem:    (k) => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v) },
    removeItem: (k) => { delete store[k] },
    clear:      () => { store = {} },
  }
})()
Object.defineProperty(window, 'localStorage', { value: localStorageMock })
