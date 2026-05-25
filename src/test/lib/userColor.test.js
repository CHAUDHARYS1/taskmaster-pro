import { describe, it, expect } from 'vitest'
import { userColor } from '../../lib/userColor'

const COLORS = ['#2563EB', '#15803d', '#7c3aed', '#c2410c', '#be185d', '#0f766e']

describe('userColor', () => {
  it('returns a valid color from the palette', () => {
    const c = userColor('user-123')
    expect(COLORS).toContain(c)
  })

  it('is deterministic — same id always returns same color', () => {
    const id = 'abc-def-ghi'
    expect(userColor(id)).toBe(userColor(id))
  })

  it('different ids can return different colors', () => {
    const colors = new Set(
      ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(userColor)
    )
    expect(colors.size).toBeGreaterThan(1)
  })

  it('handles empty string without throwing', () => {
    expect(() => userColor('')).not.toThrow()
  })
})
