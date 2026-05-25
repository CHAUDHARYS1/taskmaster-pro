export default function ShortcutsHelp({ onClose }) {
  const shortcuts = [
    { keys: ['N'],   description: 'Add new task' },
    { keys: ['/'],   description: 'Focus search' },
    { keys: ['?'],   description: 'Toggle this cheatsheet' },
    { keys: ['Esc'], description: 'Close panel / modal' },
  ]

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
        <ul className="shortcuts-list">
          {shortcuts.map(({ keys, description }) => (
            <li key={description} className="shortcut-row">
              <span className="shortcut-desc">{description}</span>
              <span className="shortcut-keys">
                {keys.map(k => <kbd key={k} className="shortcut-kbd">{k}</kbd>)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
