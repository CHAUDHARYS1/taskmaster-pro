import { Check, X, Info } from '@phosphor-icons/react'
import { useToast } from '../../contexts/ToastContext'

const ICONS = {
  success: <Check size={18} weight="bold" aria-hidden="true" />,
  error:   <X    size={18} weight="bold" aria-hidden="true" />,
  info:    <Info size={18}               aria-hidden="true" />,
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
              <X size={16} weight="bold" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
