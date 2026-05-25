const COLS = ['To Do', 'In Progress', 'In Review', 'Done']

// Widths give each skeleton card a slightly different feel
const CARD_WIDTHS = [
  ['85%', '60%', '75%'],
  ['70%', '90%'],
  ['80%', '55%', '65%'],
  ['75%', '40%'],
]

function SkeletonCard({ lines }) {
  return (
    <li className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line" style={{ width: lines[0] }} />
      {lines[1] && <div className="skeleton-line skeleton-line--sm" style={{ width: lines[1] }} />}
      <div className="skeleton-footer">
        <div className="skeleton-chip" />
        <div className="skeleton-avatar" />
      </div>
    </li>
  )
}

export default function BoardSkeleton() {
  return (
    <div className="app-shell" aria-busy="true" aria-label="Loading board">
      {/* Sidebar shell */}
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="skeleton-line" style={{ width: '60%', height: '20px' }} />
        </div>
        <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div className="skeleton-line" style={{ width: '40%', height: '12px' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '36px', borderRadius: 'var(--radius)' }} />
          <div className="skeleton-line" style={{ width: '80%', height: '36px', borderRadius: 'var(--radius)' }} />
        </div>
      </aside>

      <main className="board-main">
        {/* Header shell */}
        <div className="board-header">
          <div className="skeleton-line" style={{ width: '160px', height: '16px' }} />
        </div>

        {/* Filter bar shell */}
        <div className="filter-bar">
          <div className="skeleton-line" style={{ width: '220px', height: '32px', borderRadius: 'var(--radius)' }} />
        </div>

        {/* Columns */}
        <div className="board-columns-wrap">
          <div className="board-columns">
            {COLS.map((label, i) => (
              <div key={label} className="column">
                <div className="column-header">
                  <span className="column-label">{label}</span>
                  <div className="skeleton-chip" />
                </div>
                <ul className="column-list">
                  {CARD_WIDTHS[i].map((_, j) => (
                    <SkeletonCard key={j} lines={[CARD_WIDTHS[i][j], j === 0 ? '45%' : undefined]} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
