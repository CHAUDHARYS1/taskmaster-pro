import { useToast } from '../../contexts/ToastContext'

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32">
      <polyline points="40 144 96 200 216 72"/>
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="32">
      <line x1="200" y1="56" x2="56" y2="200"/><line x1="56" y1="56" x2="200" y2="200"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 256 256" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16">
      <circle cx="128" cy="128" r="96"/><line x1="128" y1="128" x2="128" y2="176"/><circle cx="128" cy="88" r="10" fill="currentColor" stroke="none"/>
    </svg>
  ),
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()
  if (!toasts.length) return null

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(t => {
        const buttons = t.actions ?? (t.action ? [t.action] : [])
        return (
          <div key={t.id} className={`toast toast--${t.type}`} role="status">
            <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
            <p className="toast-msg">{t.message}</p>
            {(t.selectAction || buttons.length > 0) && (
              <div className="toast-actions">
                {t.selectAction && t.selectAction.options.length > 0 && (
                  <select
                    className="toast-select"
                    defaultValue=""
                    onChange={e => {
                      if (!e.target.value) return
                      t.selectAction.onChange(e.target.value)
                      dismiss(t.id)
                    }}
                  >
                    <option value="" disabled>{t.selectAction.placeholder}</option>
                    {t.selectAction.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}
                {buttons.map((a, i) => (
                  <button
                    key={i}
                    className="toast-action"
                    onClick={() => { a.onClick(); dismiss(t.id) }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="32">
                <line x1="200" y1="56" x2="56" y2="200"/><line x1="56" y1="56" x2="200" y2="200"/>
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
