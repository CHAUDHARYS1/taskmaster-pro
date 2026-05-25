const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['N'],       description: 'New task' },
      { keys: ['/'],       description: 'Focus search' },
      { keys: ['B'],       description: 'Board view' },
      { keys: ['L'],       description: 'List view' },
      { keys: ['?'],       description: 'Toggle shortcuts' },
      { keys: ['Esc'],     description: 'Close panel / modal' },
    ],
  },
  {
    label: 'Board',
    shortcuts: [
      { keys: ['D'],       description: 'Toggle dark mode' },
      { keys: ['F'],       description: 'Focus filter bar' },
      { keys: ['Del'],     description: 'Delete open task (owner)' },
    ],
  },
  {
    label: 'Task panel',
    shortcuts: [
      { keys: ['←'],       description: 'Previous task' },
      { keys: ['→'],       description: 'Next task' },
      { keys: ['Enter'],   description: 'Submit comment' },
      { keys: ['⇧', '+', 'Enter'], description: 'New line in comment' },
    ],
  },
]

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
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        {SHORTCUT_GROUPS.map(group => (
          <div key={group.label}>
            <p className="shortcuts-group-label">{group.label}</p>
            <ul className="shortcuts-list">
              {group.shortcuts.map(({ keys, description }) => (
                <li key={description} className="shortcut-row">
                  <span className="shortcut-desc">{description}</span>
                  <span className="shortcut-keys">
                    {keys.map((k, i) => (
                      <kbd key={i} className="shortcut-kbd">{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
