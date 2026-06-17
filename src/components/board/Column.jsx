import { memo, useRef, useState } from 'react'
import { useDroppable, useDndContext } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ArrowRight, CaretLeft } from '@phosphor-icons/react'
import TaskCard from './TaskCard'
import { useWorkspace } from '../../contexts/WorkspaceContext'

function Column({ column, tasks, columns, canEdit, canDelete, hasFilter, onDelete, onArchive, onOpen, onComplete, onMoveToStatus, editingMap, onQuickAdd, showProject, bulkMode, selectedIds, onBulkToggle, onMove, isFirstColumn, isLastColumn, searchQuery }) {
  const { setNodeRef } = useDroppable({ id: column.id })
  const { over }       = useDndContext()
  const isOver         = over?.id === column.id || tasks.some(t => t.id === over?.id)
  const { workspaceTemplate } = useWorkspace()
  const isJobTracker = workspaceTemplate === 'job-tracker'

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(`tm_col_collapsed_${column.id}`) === 'true' } catch { return false }
  })

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(`tm_col_collapsed_${column.id}`, String(next)) } catch {}
      return next
    })
  }

  const [text, setText] = useState('')
  const [desc, setDesc] = useState('')
  const inputRef = useRef(null)
  const descRef  = useRef(null)

  const showDesc = text.length > 0

  const resetDescHeight = () => {
    if (descRef.current) descRef.current.style.height = ''
  }

  const submit = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    setText('')
    setDesc('')
    resetDescHeight()
    await onQuickAdd(trimmed, desc.trim() || null)
    inputRef.current?.focus()
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter')  { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setDesc(''); resetDescHeight() }
  }

  const handleDescChange = (e) => {
    setDesc(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
    if (e.key === 'Escape') { setText(''); setDesc(''); resetDescHeight() }
  }

  const JOB_EMPTY = {
    toDo:       'No saved jobs yet — add one above',
    inProgress: 'No submitted applications yet',
    inReview:   'No active interviews yet',
    done:       'No closed applications',
  }

  let emptyText = null
  if (tasks.length === 0) {
    if (hasFilter) emptyText = 'No matches'
    else if (canEdit) emptyText = (isJobTracker ? JOB_EMPTY[column.id] : null) ?? 'Drop tasks here'
    else emptyText = (isJobTracker ? JOB_EMPTY[column.id] : null) ?? 'No tasks'
  }

  if (collapsed && window.innerWidth > 768) {
    return (
      <div
        className={`column column--${column.id} column--collapsed`}
        style={column.color ? { '--col-color': column.color } : undefined}
        onClick={toggleCollapsed}
        role="button"
        aria-label={`Expand ${column.label} column`}
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapsed() } }}
      >
        <div className="column-rail">
          <span className="column-rail-label">{column.label}</span>
          <span className="column-count">{tasks.length}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`column column--${column.id} ${isOver && canEdit ? 'column--over' : ''}`}
      style={column.color ? { '--col-color': column.color } : undefined}
    >
      <div className="column-header">
        <span className="column-label">{column.label}</span>
        <div className="column-header-right">
          <span className="column-count">{tasks.length}</span>
          <button
            className="column-collapse-btn"
            onClick={toggleCollapsed}
            aria-label={`Collapse ${column.label} column`}
            title="Collapse column"
          >
            <CaretLeft size={13} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </div>

      {onQuickAdd && canEdit && (
        <div className="quick-add quick-add--top">
          <div className="quick-add-title-row">
            <input
              ref={inputRef}
              className="quick-add-input"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder={isJobTracker ? 'Company — Role (e.g. Stripe — Product Designer)' : 'Add a task…'}
              aria-label={isJobTracker ? 'Quick add job application' : 'Quick add task title'}
            />
            <button
              className="quick-add-submit"
              onClick={submit}
              disabled={!text.trim()}
              aria-label="Submit task"
              title="Add task"
            >
              <ArrowRight size={15} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div className={`quick-add-desc-wrap${showDesc ? ' quick-add-desc-wrap--open' : ''}`}>
            <div className="quick-add-desc-inner">
              <textarea
                ref={descRef}
                className="quick-add-desc"
                value={desc}
                onChange={handleDescChange}
                onKeyDown={handleDescKeyDown}
                placeholder="Add a description… (optional)"
                rows={2}
                aria-label="Quick add task description"
              />
            </div>
          </div>
        </div>
      )}

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="column-list">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              canEdit={canEdit}
              canDelete={canDelete}
              onDelete={onDelete}
              onArchive={onArchive}
              onOpen={onOpen}
              onComplete={onComplete}
              onMoveToStatus={onMoveToStatus}
              columns={columns}
              editingUser={editingMap?.[task.id] ?? null}
              showProject={showProject}
              bulkMode={bulkMode}
              isSelected={selectedIds?.has(task.id) ?? false}
              onBulkToggle={onBulkToggle}
              onMove={onMove}
              isFirstColumn={isFirstColumn}
              isLastColumn={isLastColumn}
              searchQuery={searchQuery}
            />
          ))}
          {emptyText && (
            <li
              className={`column-empty${hasFilter ? ' column-empty--filtered' : ''}`}
              aria-hidden="true"
            >
              {emptyText}
            </li>
          )}
        </ul>
      </SortableContext>
    </div>
  )
}

export default memo(Column)
