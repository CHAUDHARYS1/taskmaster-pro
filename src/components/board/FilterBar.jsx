import { useEffect, useState } from 'react'
import { MagnifyingGlass, FolderSimple, User, Flag, Tag, CalendarBlank, Plus, X, Funnel } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { PRIORITIES } from '../../lib/priority'

export default function FilterBar({ workspaceId, filters, onChange, searchRef, onAdd, projects }) {
  const { labels } = useLabelsCtx()
  const [members, setMembers] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => { if (data) setMembers(data) })
  }, [workspaceId])

  const isActive = !!(filters.search || filters.assigneeId || filters.priority || filters.label || filters.due || filters.project)
  const hasFilterActive = !!(filters.assigneeId || filters.priority || filters.label || filters.due || filters.project)
  const set = (key, val) => onChange({ ...filters, [key]: val })
  const clear = () => onChange({ search: '', assigneeId: '', priority: '', label: '', due: '', project: '' })

  // Auto-open tray when a dropdown filter becomes active
  useEffect(() => {
    if (hasFilterActive) setFiltersOpen(true)
  }, [hasFilterActive])

  return (
    <div className={`filter-bar${isActive ? ' filter-bar--active' : ''}`}>

      {/* Search — always visible */}
      <div className="filter-search-wrap">
        <MagnifyingGlass size={15} className="filter-search-icon" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          className="filter-search"
          placeholder="Search tasks… (/)"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          aria-label="Search tasks"
        />
      </div>

      {/* Filter tray — always visible on desktop, collapsible on mobile */}
      <div className={`filter-tray${filtersOpen ? ' filter-tray--open' : ''}`}>
        {projects && (
          <div className={`filter-icon-wrap${filters.project ? ' filter-icon-wrap--active' : ''}`}>
            <FolderSimple size={16} className="filter-icon" aria-hidden="true" />
            <select
              className={`filter-select${filters.project ? ' filter-select--active' : ''}`}
              value={filters.project}
              onChange={e => set('project', e.target.value)}
              aria-label="Filter by project"
            >
              <option value="">Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className={`filter-icon-wrap${filters.assigneeId ? ' filter-icon-wrap--active' : ''}`}>
          <User size={16} className="filter-icon" aria-hidden="true" />
          <select
            className={`filter-select${filters.assigneeId ? ' filter-select--active' : ''}`}
            value={filters.assigneeId}
            onChange={e => set('assigneeId', e.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="">Assignee</option>
            {members.map(m => (
              <option key={m.user_id} value={m.user_id}>
                {m.email.split('@')[0]}
              </option>
            ))}
          </select>
        </div>

        <div className={`filter-icon-wrap${filters.priority ? ' filter-icon-wrap--active' : ''}`}>
          <Flag size={16} className="filter-icon" aria-hidden="true" />
          <select
            className={`filter-select${filters.priority ? ' filter-select--active' : ''}`}
            value={filters.priority}
            onChange={e => set('priority', e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">Priority</option>
            {PRIORITIES.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className={`filter-icon-wrap${filters.label ? ' filter-icon-wrap--active' : ''}`}>
          <Tag size={16} className="filter-icon" aria-hidden="true" />
          <select
            className={`filter-select${filters.label ? ' filter-select--active' : ''}`}
            value={filters.label}
            onChange={e => set('label', e.target.value)}
            aria-label="Filter by label"
          >
            <option value="">Label</option>
            {labels.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className={`filter-icon-wrap${filters.due ? ' filter-icon-wrap--active' : ''}`}>
          <CalendarBlank size={16} className="filter-icon" aria-hidden="true" />
          <select
            className={`filter-select${filters.due ? ' filter-select--active' : ''}`}
            value={filters.due}
            onChange={e => set('due', e.target.value)}
            aria-label="Filter by due date"
          >
            <option value="">Due date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due today</option>
            <option value="week">Due this week</option>
            <option value="none">No due date</option>
          </select>
        </div>

        {isActive && (
          <button className="filter-clear" onClick={clear} aria-label="Clear all filters">
            <X size={15} className="filter-clear-icon" aria-hidden="true" />
            <span className="filter-clear-label">Clear</span>
          </button>
        )}
      </div>

      {/* Filter toggle — mobile only, hidden on desktop via CSS */}
      <button
        className={`filter-tray-toggle${hasFilterActive ? ' filter-tray-toggle--active' : ''}`}
        onClick={() => setFiltersOpen(v => !v)}
        aria-label={filtersOpen ? 'Close filters' : 'Open filters'}
        aria-expanded={filtersOpen}
      >
        <Funnel size={16} weight={hasFilterActive ? 'fill' : 'regular'} aria-hidden="true" />
        {hasFilterActive && <span className="filter-tray-badge" aria-hidden="true" />}
      </button>

      {onAdd && (
        <button className="btn-primary btn-sm filter-add-btn" onClick={onAdd} aria-label="Add task">
          <Plus size={18} className="filter-add-icon" aria-hidden="true" />
          <span className="filter-add-label">Add Task</span>
        </button>
      )}
    </div>
  )
}
