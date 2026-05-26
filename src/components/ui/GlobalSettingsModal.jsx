import { useEffect, useState } from 'react'
import { X, Sun, Moon, CaretLeft, CaretRight, Bug } from '@phosphor-icons/react'
import { useTheme } from '../../contexts/ThemeContext'
import { SHORTCUT_GROUPS } from './ShortcutsHelp'

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

export default function GlobalSettingsModal({ onClose, onBugReport }) {
  const { isDark, toggle: toggleTheme } = useTheme()
  const [page, setPage] = useState('main')

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (page === 'keybinds') setPage('main')
        else onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, page])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet settings-sheet"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="modal-hdr">
          {page === 'keybinds' ? (
            <div className="settings-hdr-left">
              <button className="btn-ghost settings-back-btn" onClick={() => setPage('main')} aria-label="Back">
                <CaretLeft size={18} aria-hidden="true" />
              </button>
              <h2 className="modal-ttl">Keyboard Shortcuts</h2>
            </div>
          ) : (
            <h2 className="modal-ttl">Settings</h2>
          )}
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body settings-body">
          {page === 'main' && (
            <>
              <section className="settings-section">
                <h3 className="settings-section-title">Appearance</h3>
                <div className="settings-row">
                  <div className="settings-row-label">
                    <span>Theme</span>
                    <span className="settings-row-hint">Switch between light and dark mode</span>
                  </div>
                  <button className="btn-ghost settings-theme-btn" onClick={toggleTheme} aria-pressed={isDark}>
                    {isDark
                      ? <><Sun size={16} aria-hidden="true" /> Light</>
                      : <><Moon size={16} aria-hidden="true" /> Dark</>}
                  </button>
                </div>
              </section>

              <section className="settings-section">
                <h3 className="settings-section-title">More</h3>
                <button className="settings-nav-item" onClick={() => setPage('keybinds')}>
                  <span>Keyboard shortcuts</span>
                  <CaretRight size={16} aria-hidden="true" />
                </button>
                <button className="settings-nav-item" onClick={onBugReport}>
                  <span className="settings-nav-item-inner">
                    <Bug size={16} aria-hidden="true" />
                    Report a bug / Request a feature
                  </span>
                  <CaretRight size={16} aria-hidden="true" />
                </button>
              </section>
            </>
          )}

          {page === 'keybinds' && (
            <section className="settings-section">
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.label} className="settings-shortcut-group">
                  <p className="settings-shortcut-group-label">{group.label}</p>
                  <ul className="shortcuts-list settings-shortcuts-list">
                    {group.shortcuts.map(({ keys, description }) => (
                      <li key={description} className="shortcut-row">
                        <span className="shortcut-desc">{description}</span>
                        <ShortcutKeys keys={keys} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
