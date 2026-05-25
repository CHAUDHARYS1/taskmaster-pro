import { useToast } from '../../contexts/ToastContext'

const ICONS = { success: '✓', error: '✕', info: 'ℹ' }

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()
  if (!toasts.length) return null

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} role="status">
          <span className="toast-icon" aria-hidden="true">{ICONS[t.type]}</span>
          <p className="toast-msg">{t.message}</p>
          {t.action && (
            <button
              className="toast-action"
              onClick={() => { t.action.onClick(); dismiss(t.id) }}
            >
              {t.action.label}
            </button>
          )}
          <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  )
}
