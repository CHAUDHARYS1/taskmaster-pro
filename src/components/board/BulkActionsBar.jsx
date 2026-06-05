import { useState } from 'react'
import { X, Archive, Trash, ArrowRight, UserCircle, CheckSquare } from '@phosphor-icons/react'

function memberDisplayName(m) {
  const full = [m.first_name, m.last_name].filter(Boolean).join(' ')
  return full || m.display_name || m.email?.split('@')[0] || m.email
}

export default function BulkActionsBar({
  selectedCount,
  totalCount,
  columns,
  members,
  onArchive,
  onMove,
  onAssign,
  onDelete,
  onClearAll,
  onSelectAll,
}) {
  const [openMenu, setOpenMenu] = useState(null) // 'move' | 'assign' | null
  const allSelected = selectedCount === totalCount

  const closeMenu = () => setOpenMenu(null)

  const handleMove = (status) => { onMove(status); closeMenu() }
  const handleAssign = (userId) => { onAssign(userId); closeMenu() }

  return (
    <div className="bulk-bar" role="toolbar" aria-label={`${selectedCount} task${selectedCount !== 1 ? 's' : ''} selected`}>
      {/* Left: count + clear */}
      <div className="bulk-bar__left">
        <button className="bulk-bar__clear" onClick={onClearAll} aria-label="Clear selection" title="Clear selection">
          <X size={13} weight="bold" aria-hidden="true" />
        </button>
        <span className="bulk-bar__count">
          {selectedCount} selected
        </span>
        <button
          className="bulk-bar__select-all"
          onClick={allSelected ? onClearAll : onSelectAll}
          aria-label={allSelected ? 'Deselect all' : 'Select all'}
        >
          <CheckSquare size={13} weight={allSelected ? 'fill' : 'regular'} aria-hidden="true" />
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Right: actions */}
      <div className="bulk-bar__actions">

        {/* Archive */}
        <button className="bulk-bar__btn" onClick={onArchive} title="Archive selected">
          <Archive size={15} weight="bold" aria-hidden="true" />
          <span>Archive</span>
        </button>

        {/* Move to */}
        <div className="bulk-bar__menu-wrap">
          <button
            className={`bulk-bar__btn${openMenu === 'move' ? ' bulk-bar__btn--open' : ''}`}
            onClick={() => setOpenMenu(p => p === 'move' ? null : 'move')}
            title="Move to…"
            aria-expanded={openMenu === 'move'}
            aria-haspopup="true"
          >
            <ArrowRight size={15} weight="bold" aria-hidden="true" />
            <span>Move to</span>
          </button>
          {openMenu === 'move' && (
            <div className="bulk-bar__menu" role="menu">
              {columns.map(c => (
                <button
                  key={c.id}
                  className="bulk-bar__menu-item"
                  role="menuitem"
                  onClick={() => handleMove(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assign to */}
        {members.length > 0 && (
          <div className="bulk-bar__menu-wrap">
            <button
              className={`bulk-bar__btn${openMenu === 'assign' ? ' bulk-bar__btn--open' : ''}`}
              onClick={() => setOpenMenu(p => p === 'assign' ? null : 'assign')}
              title="Assign to…"
              aria-expanded={openMenu === 'assign'}
              aria-haspopup="true"
            >
              <UserCircle size={15} weight="bold" aria-hidden="true" />
              <span>Assign</span>
            </button>
            {openMenu === 'assign' && (
              <div className="bulk-bar__menu" role="menu">
                <button
                  className="bulk-bar__menu-item"
                  role="menuitem"
                  onClick={() => handleAssign(null)}
                >
                  Unassign
                </button>
                {members.map(m => (
                  <button
                    key={m.user_id}
                    className="bulk-bar__menu-item"
                    role="menuitem"
                    onClick={() => handleAssign(m.user_id)}
                  >
                    {memberDisplayName(m)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete */}
        <button className="bulk-bar__btn bulk-bar__btn--danger" onClick={onDelete} title="Delete selected">
          <Trash size={15} weight="bold" aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>

      {/* Click-outside to close menus */}
      {openMenu && (
        <div className="bulk-bar__backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
    </div>
  )
}
