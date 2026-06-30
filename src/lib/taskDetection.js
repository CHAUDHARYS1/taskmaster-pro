import * as chrono from 'chrono-node'

// Matches checkbox, bullet, or numbered list prefixes
const STRUCTURAL_RE = /^(\s*[-*•]\s*\[[ x]\]|\s*\[[ x]\]|[☐✓✗]|\s*[-*•]\s+|\s*\d+\.\s+)/u

const KEYWORDS = [
  'need to', 'have to', 'should', 'must', 'remember to',
  "don't forget to", 'todo', 'to-do', 'action item', 'follow up on', 'due',
]

const IMPERATIVE_VERBS = [
  'call', 'email', 'send', 'fix', 'update', 'schedule', 'review',
  'finish', 'submit', 'prepare', 'follow up', 'contact', 'draft',
  'confirm', 'book', 'create', 'set up', 'check',
]

const IMPERATIVE_RE = new RegExp(
  `^\\s*(${IMPERATIVE_VERBS.join('|')})\\b`,
  'i',
)

// Strip list/checkbox prefixes to get the bare task text
function cleanLine(line) {
  return line
    .replace(/^\s*[-*•]\s*\[[ x]\]\s*/iu, '')
    .replace(/^\s*\[[ x]\]\s*/iu, '')
    .replace(/^[☐✓✗]\s*/u, '')
    .replace(/^\s*[-*•]\s+/, '')
    .replace(/^\s*\d+\.\s+/, '')
    .trim()
}

function scoreLine(line) {
  let score = 0
  const lower = line.toLowerCase()

  // Rule 1: structural cue
  if (STRUCTURAL_RE.test(line)) score += 3

  // Rule 2: keyword triggers, capped at +2
  let kwHits = 0
  for (const kw of KEYWORDS) {
    if (lower.includes(kw)) kwHits++
  }
  score += Math.min(kwHits, 2)

  // Rule 3: imperative verb at start (check original AND cleaned to handle "- [ ] Submit…")
  if (IMPERATIVE_RE.test(line.trim()) || IMPERATIVE_RE.test(cleanLine(line))) score += 2

  // Rule 4: date/deadline detected
  const parsed = chrono.parse(line, new Date(), { forwardDate: true })
  const dueDate = parsed.length > 0 ? parsed[0].date() : null
  if (dueDate) score += 1

  return { score, dueDate }
}

// Split prose into sentences on . ! ? followed by whitespace
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 4)
}

/**
 * Scan plain text for task candidates.
 * @param {string} text - plain text from the editor
 * @returns {{ text: string, suggestedDueDate: string|null, confidence: number, sourceLine: number }[]}
 */
export function detectTasksFromText(text) {
  if (!text || typeof text !== 'string') return []

  const candidates = []
  const lines = text.split('\n')

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim()
    if (!trimmed) return

    const isListLike = STRUCTURAL_RE.test(line)

    if (isListLike) {
      const { score, dueDate } = scoreLine(line)
      if (score >= 3) {
        candidates.push({
          text: cleanLine(line) || trimmed,
          suggestedDueDate: dueDate ? toDateString(dueDate) : null,
          confidence: score,
          sourceLine: lineIdx + 1,
        })
      }
    } else {
      // For prose lines, check sentences individually
      const sentences = splitSentences(trimmed)
      const units = sentences.length > 0 ? sentences : [trimmed]
      for (const sentence of units) {
        const { score, dueDate } = scoreLine(sentence)
        if (score >= 3) {
          candidates.push({
            text: sentence.trim(),
            suggestedDueDate: dueDate ? toDateString(dueDate) : null,
            confidence: score,
            sourceLine: lineIdx + 1,
          })
        }
      }
    }
  })

  return candidates
}

function toDateString(date) {
  // YYYY-MM-DD in local time
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
