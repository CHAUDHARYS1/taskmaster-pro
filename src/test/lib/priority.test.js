import { describe, it, expect } from 'vitest'
import { PRIORITIES, priorityMap } from '../../lib/priority'

describe('PRIORITIES', () => {
  it('has exactly 4 levels', () => {
    expect(PRIORITIES).toHaveLength(4)
  })

  it('each priority has required fields', () => {
    for (const p of PRIORITIES) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('name')
      expect(p).toHaveProperty('color')
      expect(p).toHaveProperty('bg')
      expect(p).toHaveProperty('icon')
    }
  })

  it('ids are low, medium, high, urgent', () => {
    expect(PRIORITIES.map(p => p.id)).toEqual(['low', 'medium', 'high', 'urgent'])
  })
})

describe('priorityMap', () => {
  it('keys match PRIORITIES ids', () => {
    expect(Object.keys(priorityMap)).toEqual(PRIORITIES.map(p => p.id))
  })

  it('looks up a priority by id', () => {
    expect(priorityMap['high'].name).toBe('High')
    expect(priorityMap['urgent'].icon).toBe('!!')
  })
})
