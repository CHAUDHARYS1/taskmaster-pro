import { X } from '@phosphor-icons/react'

const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', 'N'],         description: 'New task' },
      { keys: ['/'],                  description: 'Focus search' },
      { keys: ['Ctrl', 'B'],         description: 'Board view' },
      { keys: ['Ctrl', 'L'],         description: 'List view' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Archive view' },
      { keys: ['?'],                  description: 'Toggle shortcuts' },
      { keys: ['Esc'],               description: 'Close panel / modal' },
    ],
  },
  {
    label: 'Board',
    shortcuts: [
      { keys: ['Ctrl', 'D'],         description: 'Toggle dark mode' },
      { keys: ['Ctrl', 'F'],         description: 'Focus filter bar' },
      { keys: ['Del'],               description: 'Delete open task (owner)' },
    ],
  },
  {
    label: 'Task panel',
    shortcuts: [
      { keys: ['←'],                 description: 'Previous task' },
      { keys: ['→'],                 description: 'Next task' },
      { keys: ['Enter'],             description: 'Submit comment' },
      { keys: ['⇧', 'Enter'],       description: 'New line in comment' },
    ],
  },
]

export { SHORTCUT_GROUPS }

function ShortcutKeys({ keys }) {
  return (
    <span className="shortcut-keys">
      {keys.flatMap((k, i) =>
        i === 0
          ? [<kbd key={k} className="shortcut-kbd">{k}</kbd>]
          : [<span key={`sep-${i}`} className="shortcut-sep">+</span>, <kbd key={k} className="shortcut-kbd">{k}</kbd>]
      )}
    </span>
  )
}

export default function ShortcutsHelp({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="shortcuts-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        <div className="modal-hdr">
          <h2 className="modal-ttl">Keyboard shortcuts</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} weight="bold" aria-hidden="true" /></button>
        </div>

        {SHORTCUT_GROUPS.map(group => (
          <div key={group.label}>
            <p className="shortcuts-group-label">{group.label}</p>
            <ul className="shortcuts-list">
              {group.shortcuts.map(({ keys, description }) => (
                <li key={description} className="shortcut-row">
                  <span className="shortcut-desc">{description}</span>
                  <ShortcutKeys keys={keys} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
