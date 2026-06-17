import { ArrowsClockwise, X } from '@phosphor-icons/react'

const FREQ_OPTIONS = [
  { id: 'daily',   label: 'Daily' },
  { id: 'weekly',  label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly',  label: 'Yearly' },
]

export default function RecurrencePicker({ value, onChange, hasDueDate }) {
  const isSet     = !!value
  const frequency = value?.frequency ?? 'weekly'
  const interval  = value?.interval  ?? 1
  const endDate   = value?.end_date  ?? ''

  const update = (patch) => onChange({ frequency, interval, ...value, ...patch })
  const clear  = () => onChange(null)
  const enable = () => onChange({ frequency: 'weekly', interval: 1 })

  if (!hasDueDate) return (
    <span className="recurrence-no-date">Set a due date first to enable repeat.</span>
  )

  return (
    <div className="recurrence-picker">
      {!isSet ? (
        <button type="button" className="recurrence-enable-btn" onClick={enable}>
          <ArrowsClockwise size={13} aria-hidden="true" />
          Set repeat
        </button>
      ) : (
        <>
          <div className="recurrence-row">
            <span className="recurrence-row-label">Every</span>
            <input
              type="number"
              className="recurrence-interval"
              min={1}
              max={99}
              value={interval}
              onChange={e => update({ interval: Math.max(1, parseInt(e.target.value) || 1) })}
              aria-label="Repeat interval"
            />
            <select
              className="recurrence-freq"
              value={frequency}
              onChange={e => update({ frequency: e.target.value })}
              aria-label="Repeat frequency"
            >
              {FREQ_OPTIONS.map(f => (
                <option key={f.id} value={f.id}>
                  {interval === 1 ? f.label : f.label.toLowerCase() + 's'}
                </option>
              ))}
            </select>
          </div>
          <div className="recurrence-row">
            <label className="recurrence-row-label" htmlFor="recurrence-end">Until</label>
            <input
              id="recurrence-end"
              type="date"
              className="recurrence-end-date"
              value={endDate}
              onChange={e => update({ end_date: e.target.value || undefined })}
              aria-label="Repeat end date (optional)"
            />
            {endDate && (
              <button
                type="button"
                className="recurrence-clear-end"
                onClick={() => update({ end_date: undefined })}
                aria-label="Remove end date"
              >
                <X size={11} weight="bold" aria-hidden="true" />
              </button>
            )}
            {!endDate && <span className="recurrence-until-hint">optional</span>}
          </div>
          <button type="button" className="recurrence-remove-btn" onClick={clear}>
            Remove repeat
          </button>
        </>
      )}
    </div>
  )
}
