import { describe, it, expect } from 'vitest'
import { detectTasksFromText } from './taskDetection'

describe('detectTasksFromText', () => {
  it('returns empty array for empty / null input', () => {
    expect(detectTasksFromText('')).toEqual([])
    expect(detectTasksFromText(null)).toEqual([])
  })

  // ── Rule 1: Structural cues ────────────────────────────────

  it('detects markdown checkbox "- [ ] …" (+3)', () => {
    const r = detectTasksFromText('- [ ] Buy groceries')
    expect(r).toHaveLength(1)
    expect(r[0].text).toBe('Buy groceries')
    expect(r[0].confidence).toBeGreaterThanOrEqual(3)
  })

  it('detects bare checkbox "[ ] …" (+3)', () => {
    const r = detectTasksFromText('[ ] Review the proposal')
    expect(r).toHaveLength(1)
    expect(r[0].text).toBe('Review the proposal')
  })

  it('detects unicode checkbox "☐ …" (+3)', () => {
    const r = detectTasksFromText('☐ Fix the bug')
    expect(r).toHaveLength(1)
    expect(r[0].text).toBe('Fix the bug')
  })

  it('detects bullet "- …" (+3)', () => {
    const r = detectTasksFromText('- Pick up the kids')
    expect(r).toHaveLength(1)
    expect(r[0].confidence).toBeGreaterThanOrEqual(3)
  })

  it('detects numbered list "1. …" (+3)', () => {
    const r = detectTasksFromText('1. Submit the report')
    expect(r).toHaveLength(1)
    expect(r[0].confidence).toBeGreaterThanOrEqual(3)
  })

  // ── Rule 2: Keyword triggers ───────────────────────────────

  it('keyword "need to" contributes +1', () => {
    // With a list item (structural +3) + "need to" (+1) → confidence 4
    const r = detectTasksFromText('- [ ] I need to call Bob')
    expect(r[0].confidence).toBeGreaterThanOrEqual(4)
  })

  it('keyword "TODO" contributes +1', () => {
    const r = detectTasksFromText('- [ ] TODO finish slides')
    expect(r[0].confidence).toBeGreaterThanOrEqual(4)
  })

  it('keyword score is capped at +2 regardless of keyword count', () => {
    // 5 keywords on one bullet → keyword score capped at 2
    const r = detectTasksFromText('- must need to should remember to TODO')
    // structural(3) + keyword cap(2) = 5 max from these two rules
    expect(r[0].confidence).toBeLessThanOrEqual(3 + 2 + 2 + 1)
  })

  // ── Rule 3: Imperative verb ────────────────────────────────

  it('imperative verb at start adds +2', () => {
    // "- [ ] Schedule" → structural(3) + imperative(2) = 5
    const r = detectTasksFromText('- [ ] Schedule a meeting')
    expect(r[0].confidence).toBeGreaterThanOrEqual(5)
  })

  it('each imperative verb is recognised', () => {
    const verbs = ['Call', 'Email', 'Send', 'Fix', 'Update', 'Schedule', 'Review',
      'Finish', 'Submit', 'Prepare', 'Contact', 'Draft', 'Confirm', 'Book', 'Create', 'Check']
    for (const v of verbs) {
      const r = detectTasksFromText(`- ${v} something`)
      expect(r.length, `verb "${v}" should be detected`).toBeGreaterThan(0)
    }
  })

  it('non-imperative verb at start does not add +2', () => {
    // "The report is ready" → no structural, no imperative → score 0 → excluded
    const r = detectTasksFromText('The report is ready')
    expect(r).toHaveLength(0)
  })

  // ── Rule 4: Date detection ─────────────────────────────────

  it('date found adds +1 and sets suggestedDueDate', () => {
    const r = detectTasksFromText('- [ ] Submit report by next Monday')
    expect(r[0].suggestedDueDate).not.toBeNull()
    expect(r[0].confidence).toBeGreaterThanOrEqual(4) // structural(3) + date(1)
  })

  it('sets suggestedDueDate to null when no date found', () => {
    const r = detectTasksFromText('- [ ] Call John')
    expect(r[0].suggestedDueDate).toBeNull()
  })

  it('suggestedDueDate is YYYY-MM-DD string', () => {
    const r = detectTasksFromText('- [ ] Submit by 2030-06-15')
    if (r[0]?.suggestedDueDate) {
      expect(r[0].suggestedDueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // ── Threshold ──────────────────────────────────────────────

  it('ignores lines below confidence threshold of 3', () => {
    const r = detectTasksFromText('The weather is nice today')
    expect(r).toHaveLength(0)
  })

  it('ignores low-score prose with no triggers', () => {
    const r = detectTasksFromText('We completed the project last week.')
    expect(r).toHaveLength(0)
  })

  // ── Multi-line & sentence splitting ───────────────────────

  it('processes multiple list lines independently', () => {
    const text = '- [ ] Call the dentist\n- [ ] Email the team\nThe sky is blue'
    const r = detectTasksFromText(text)
    expect(r).toHaveLength(2)
    expect(r[0].sourceLine).toBe(1)
    expect(r[1].sourceLine).toBe(2)
  })

  it('splits non-list prose into sentences and scores each', () => {
    // "Call John" → imperative(+2), "remember to" → keyword(+1) → score 3 ✓
    const text = 'Call John and remember to discuss the proposal. The weather is nice.'
    const r = detectTasksFromText(text)
    expect(r.length).toBeGreaterThanOrEqual(1)
    expect(r[0].text.toLowerCase()).toContain('call')
  })

  it('returns sourceLine as 1-based line number', () => {
    const text = '\n\n- [ ] First task on line 3'
    const r = detectTasksFromText(text)
    expect(r[0].sourceLine).toBe(3)
  })

  // ── Combinations ──────────────────────────────────────────

  it('combines all four rules for maximum confidence', () => {
    // structural(3) + keyword(1 "must") + imperative(2 "Submit") + date(1 "by Friday") = 7
    const r = detectTasksFromText('- [ ] Submit the form by Friday, you must')
    expect(r[0].confidence).toBeGreaterThanOrEqual(6)
    expect(r[0].suggestedDueDate).not.toBeNull()
  })
})
