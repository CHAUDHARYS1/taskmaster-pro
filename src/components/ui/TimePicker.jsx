const HOURS   = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function parse(value) {
  if (!value) return { h: '', m: '00', period: 'AM' }
  const [hStr, mStr] = value.split(':')
  const h24 = parseInt(hStr, 10)
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24
  const m = MINUTES.includes(mStr) ? mStr : MINUTES.reduce((best, c) =>
    Math.abs(parseInt(c) - parseInt(mStr)) < Math.abs(parseInt(best) - parseInt(mStr)) ? c : best
  )
  return { h: String(h12), m, period }
}

function to24(h, m, period) {
  if (!h) return ''
  const hNum = parseInt(h, 10)
  let h24
  if (period === 'AM') h24 = hNum === 12 ? 0 : hNum
  else                  h24 = hNum === 12 ? 12 : hNum + 12
  return `${String(h24).padStart(2, '0')}:${m}`
}

export default function TimePicker({ value, onChange, disabled }) {
  const { h, m, period } = parse(value)

  const update = (patch) => {
    const next = { h, m, period, ...patch }
    onChange(to24(next.h, next.m, next.period))
  }

  return (
    <div className={`time-picker${disabled ? ' time-picker--disabled' : ''}`} aria-label="Time">
      <select
        className="time-picker-select"
        value={h}
        onChange={e => update({ h: e.target.value })}
        disabled={disabled}
        aria-label="Hour"
      >
        <option value="">--</option>
        {HOURS.map(n => <option key={n} value={String(n)}>{n}</option>)}
      </select>
      <span className="time-picker-sep" aria-hidden="true">:</span>
      <select
        className="time-picker-select"
        value={m}
        onChange={e => update({ m: e.target.value })}
        disabled={disabled || !h}
        aria-label="Minute"
      >
        {MINUTES.map(min => <option key={min} value={min}>{min}</option>)}
      </select>
      <button
        type="button"
        className="time-picker-period"
        onClick={() => update({ period: period === 'AM' ? 'PM' : 'AM' })}
        disabled={disabled || !h}
        aria-label={`Switch to ${period === 'AM' ? 'PM' : 'AM'}`}
      >
        {period}
      </button>
    </div>
  )
}
