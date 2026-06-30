import { parse as chronoParse } from 'chrono-node'

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
  const parsed = chronoParse(line, new Date(), { forwardDate: true })
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

// Score a single list item given its type prefix, return candidate or null
function scoreListItem(itemText, prefix) {
  if (!itemText) return null
  const { score, dueDate } = scoreLine(`${prefix}${itemText}`)
  if (score < 3) return null
  return {
    text: itemText,
    description: null,
    suggestedDueDate: dueDate ? toDateString(dueDate) : null,
    confidence: score,
  }
}

// Flush accumulated paragraphs as prose task candidates
function flushProse(paragraphs, candidates) {
  for (const text of paragraphs) {
    const sentences = splitSentences(text)
    const units = sentences.length > 0 ? sentences : [text]
    for (const sentence of units) {
      const { score, dueDate } = scoreLine(sentence)
      if (score >= 3) {
        candidates.push({
          text: sentence.trim(),
          description: null,
          suggestedDueDate: dueDate ? toDateString(dueDate) : null,
          confidence: score,
        })
      }
    }
  }
}

/**
 * Walk a ProseMirror document and return task candidates.
 *
 * Grouping rules:
 *  - List under a heading → 1 task (heading = title, preceding paragraphs = description)
 *  - List with no heading → 1 task per item (standalone behavior)
 *  - Paragraphs not followed by a list → scored as prose tasks
 *
 * @param {import('@tiptap/pm/model').Node} pmDoc
 * @returns {{ text: string, description: string|null, suggestedDueDate: string|null, confidence: number }[]}
 */
export function detectTasksFromDoc(pmDoc) {
  if (!pmDoc) return []
  const candidates = []
  let currentHeading = null  // heading text waiting for a list to group under it
  let descBuf = []           // paragraphs since last heading / reset
  let lastWasList = false

  // Emit 1 grouped task from a heading + optional description + list
  function emitGroupedTask(headingText, paragraphs, listNode) {
    const description = paragraphs.length > 0 ? paragraphs.join('\n') : null

    // Scan list items for the first parseable date
    let dueDate = null
    listNode.forEach(child => {
      if (dueDate) return
      const parsed = chronoParse(child.textContent, new Date(), { forwardDate: true })
      if (parsed.length > 0) dueDate = parsed[0].date()
    })
    // Fall back to date in the heading itself
    if (!dueDate) {
      const h = scoreLine(headingText)
      if (h.dueDate) dueDate = h.dueDate
    }

    let confidence = 4
    if (description) confidence += 1
    if (dueDate)     confidence += 1

    candidates.push({
      text: headingText,
      description,
      suggestedDueDate: dueDate ? toDateString(dueDate) : null,
      confidence,
    })
  }

  // Emit 1 task per item in a standalone list (no heading context)
  function emitStandaloneList(node, getPrefix) {
    const description = descBuf.length > 0 ? descBuf.join('\n') : null
    node.forEach((child, _offset, idx) => {
      const text = child.textContent.trim()
      if (!text) return
      const c = scoreListItem(text, getPrefix(idx))
      if (c) {
        c.description = description
        candidates.push(c)
      }
    })
  }

  // taskItem always qualifies structurally — never filter by score
  function emitStandaloneTaskList(node) {
    const description = descBuf.length > 0 ? descBuf.join('\n') : null
    node.forEach(child => {
      const text = child.textContent.trim()
      if (!text) return
      const mark = child.attrs?.checked ? 'x' : ' '
      const c = scoreListItem(text, `- [${mark}] `)
      candidates.push(c ?? { text, description: null, suggestedDueDate: null, confidence: 3 })
      if (c) c.description = description
    })
  }

  function flushHeadingOrProse() {
    // Paragraphs that accumulated without a following list → prose scoring
    if (!lastWasList) flushProse(descBuf, candidates)
  }

  pmDoc.forEach(node => {
    const type = node.type.name

    if (type === 'heading') {
      // Heading change before any list consumed the previous heading's paragraphs
      flushHeadingOrProse()
      currentHeading = node.textContent.trim()
      descBuf = []
      lastWasList = false
      return
    }

    if (type === 'paragraph') {
      const text = node.textContent.trim()
      if (text) descBuf.push(text)
      lastWasList = false
      return
    }

    const isList = type === 'taskList' || type === 'bulletList' || type === 'orderedList'
    if (isList) {
      if (currentHeading) {
        emitGroupedTask(currentHeading, descBuf, node)
        currentHeading = null
      } else if (type === 'taskList') {
        emitStandaloneTaskList(node)
      } else if (type === 'bulletList') {
        emitStandaloneList(node, () => '- ')
      } else {
        emitStandaloneList(node, idx => `${idx + 1}. `)
      }
      descBuf = []
      lastWasList = true
      return
    }

    // Any other block (blockquote, codeBlock, hr) — flush and reset
    flushHeadingOrProse()
    currentHeading = null
    descBuf = []
    lastWasList = false
  })

  // Trailing paragraphs / heading with no list
  flushHeadingOrProse()

  return candidates
}
