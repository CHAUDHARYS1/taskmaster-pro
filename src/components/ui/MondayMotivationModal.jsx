import { X } from '@phosphor-icons/react'
import { useMondayStats } from '../../hooks/useMondayStats'

const HEATMAP_LEVELS = [
  { min: 0,  cls: 'hm-0' },
  { min: 1,  cls: 'hm-1' },
  { min: 3,  cls: 'hm-2' },
  { min: 6,  cls: 'hm-3' },
  { min: 10, cls: 'hm-4' },
]

function heatLevel(count) {
  let cls = 'hm-0'
  for (const l of HEATMAP_LEVELS) { if (count >= l.min) cls = l.cls }
  return cls
}

function motivationMessage(count) {
  const s = count === 1 ? '' : 's'
  if (count === 0) return { main: "Fresh start this week — let's make it count.", showCount: false }
  if (count <= 3)  return { main: `Every task counts.`, showCount: true }
  if (count <= 9)  return { main: `Nice work!`, showCount: true }
  return               { main: `Way to go!`, showCount: true }
}

export default function MondayMotivationModal({ workspaceId, firstName, onClose }) {
  const { lastWeekCount, lastWeekDays, miniHeatmapCells, currentStreak, loading } = useMondayStats(workspaceId)

  const greeting = firstName ? `Good morning, ${firstName}!` : 'Good morning!'
  const { main, showCount } = motivationMessage(lastWeekCount)
  const taskWord = lastWeekCount === 1 ? 'task' : 'tasks'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-sheet monday-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Weekly motivation"
      >
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        <div className="monday-modal-body">
          <p className="monday-modal-greeting">{greeting}</p>

          {loading ? (
            <div className="monday-loading" aria-label="Loading stats" />
          ) : (
            <>
              {showCount ? (
                <>
                  <p className="monday-modal-sub">Last week you completed</p>
                  <div className="monday-stat-big" aria-label={`${lastWeekCount} ${taskWord} completed last week`}>
                    <span className="monday-stat-number">{lastWeekCount}</span>
                    <span className="monday-stat-unit">{taskWord}</span>
                  </div>
                  <p className="monday-modal-message">{main}</p>
                </>
              ) : (
                <p className="monday-modal-message monday-modal-message--solo">{main}</p>
              )}

              {lastWeekDays.length > 0 && (() => {
                const maxCount = Math.max(...lastWeekDays.map(d => d.count), 1)
                return (
                  <div className="monday-week-bars" aria-label="Last week daily breakdown">
                    <p className="monday-heatmap-label">Last week by day</p>
                    <div className="monday-week-bar-row">
                      {lastWeekDays.map(({ dayLabel, date, count }) => (
                        <div key={date} className="monday-bar-col">
                          {count > 0 && <span className="monday-bar-count">{count}</span>}
                          <div
                            className={`monday-bar${count === 0 ? ' monday-bar--empty' : ''}`}
                            style={{ height: `${Math.max((count / maxCount) * 48, count > 0 ? 6 : 0)}px` }}
                            title={`${dayLabel}: ${count} task${count !== 1 ? 's' : ''}`}
                          />
                          <span className="monday-bar-label">{dayLabel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {miniHeatmapCells.length > 0 && (
                <div className="monday-heatmap-section">
                  <p className="monday-heatmap-label">Your last 12 weeks</p>
                  <div className="heatmap-grid monday-heatmap-grid">
                    {miniHeatmapCells.map(cell => (
                      <div
                        key={cell.date}
                        className={`hm-cell ${heatLevel(cell.count)}`}
                        title={`${cell.date}: ${cell.count} task${cell.count !== 1 ? 's' : ''} completed`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {currentStreak > 0 && (
                <div className="monday-streak" aria-label={`${currentStreak}-day streak`}>
                  {currentStreak}-day streak
                </div>
              )}
            </>
          )}

          <button className="btn-primary monday-modal-cta" onClick={onClose}>
            Let's go!
          </button>
        </div>
      </div>
    </div>
  )
}
