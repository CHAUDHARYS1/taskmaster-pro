import { useEffect, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { useLabelsCtx } from '../../contexts/LabelsContext'
import { PRIORITIES } from '../../lib/priority'

export default function FilterBar({ workspaceId, filters, onChange, searchRef, onAdd }) {
  const { labels } = useLabelsCtx()
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!workspaceId) return
    supabase
      .from('workspace_members_view')
      .select('user_id, email')
      .eq('workspace_id', workspaceId)
      .then(({ data }) => { if (data) setMembers(data) })
  }, [workspaceId])

  const isActive = filters.search || filters.assigneeId || filters.priority || filters.label || filters.due
  const set = (key, val) => onChange({ ...filters, [key]: val })
  const clear = () => onChange({ search: '', assigneeId: '', priority: '', label: '', due: '' })

  return (
    <div className={`filter-bar${isActive ? ' filter-bar--active' : ''}`}>
      <div className="filter-search-wrap">
        <MagnifyingGlass size={18} className="filter-search-icon" aria-hidden="true" />
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

      {isActive && (
        <button className="filter-clear" onClick={clear} aria-label="Clear all filters">
          Clear
        </button>
      )}
      {onAdd && (
        <button className="btn-primary btn-sm filter-add-btn" onClick={onAdd}>
          + Add Task
        </button>
      )}
    </div>
  )
}
