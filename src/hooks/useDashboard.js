import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabase'

function buildHeatmap(completedDates) {
  // Build a map of date → count
  const countMap = {}
  for (const d of completedDates) {
    const key = dayjs(d).format('YYYY-MM-DD')
    countMap[key] = (countMap[key] ?? 0) + 1
  }

  // Generate 371 cells: start from the Sunday of the week 52 weeks ago
  const today = dayjs()
  const startSunday = today.subtract(52, 'week').startOf('week')
  const cells = []
  for (let i = 0; i < 371; i++) {
    const date = startSunday.add(i, 'day')
    const key  = date.format('YYYY-MM-DD')
    if (date.isAfter(today)) break
    cells.push({ date: key, count: countMap[key] ?? 0, dayOfWeek: date.day() })
  }
  return cells
}

function calculateStreak(completedDates) {
  const dateSet = new Set(completedDates.map(d => dayjs(d).format('YYYY-MM-DD')))
  const today     = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  // Current streak — counts from today or yesterday (streak not broken until midnight)
  let current  = 0
  let cursor   = dateSet.has(today) ? dayjs() : dateSet.has(yesterday) ? dayjs().subtract(1, 'day') : null

  if (cursor) {
    while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
      current++
      cursor = cursor.subtract(1, 'day')
    }
  }

  // Longest streak — scan all unique dates in order
  const sorted  = [...dateSet].sort()
  let longest   = 0
  let run       = 0
  let prev      = null
  for (const key of sorted) {
    const d = dayjs(key)
    if (prev && d.diff(prev, 'day') === 1) {
      run++
    } else {
      run = 1
    }
    if (run > longest) longest = run
    prev = d
  }

  return { current, longest }
}

export function useDashboard(workspaceId) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)

    try {
      const yearAgo = dayjs().subtract(1, 'year').toISOString()

      const [allTasks, completedRecent, recentDone] = await Promise.all([
        // All tasks for status breakdown + totals
        supabase
          .from('tasks')
          .select('id, status, due_date, completed_at')
          .eq('workspace_id', workspaceId),

        // Completed tasks in last year (for heatmap + streak)
        supabase
          .from('tasks')
          .select('completed_at')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .gte('completed_at', yearAgo),

        // Recent completions with text for the activity feed
        supabase
          .from('tasks')
          .select('id, text, completed_at, status')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(8),
      ])

      if (allTasks.error)      throw allTasks.error
      if (completedRecent.error) throw completedRecent.error
      if (recentDone.error)    throw recentDone.error

      const tasks     = allTasks.data ?? []
      const doneItems = completedRecent.data ?? []
      const recent    = recentDone.data ?? []

      const today     = dayjs().startOf('day')
      const weekStart = today.startOf('week')
      const monStart  = today.startOf('month')

      const totalTasks          = tasks.length
      const totalCompleted      = tasks.filter(t => t.status === 'done').length
      const completedToday      = doneItems.filter(t => dayjs(t.completed_at).isSame(today, 'day')).length
      const completedThisWeek   = doneItems.filter(t => !dayjs(t.completed_at).isBefore(weekStart)).length
      const completedThisMonth  = doneItems.filter(t => !dayjs(t.completed_at).isBefore(monStart)).length
      const overdue             = tasks.filter(t => t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(today)).length

      const statusBreakdown = {
        toDo:       tasks.filter(t => t.status === 'toDo').length,
        inProgress: tasks.filter(t => t.status === 'inProgress').length,
        inReview:   tasks.filter(t => t.status === 'inReview').length,
        done:       tasks.filter(t => t.status === 'done').length,
      }

      const completedDates = doneItems.map(t => t.completed_at)
      const heatmap        = buildHeatmap(completedDates)
      const streak         = calculateStreak(completedDates)

      setData({
        stats: { totalTasks, totalCompleted, completedToday, completedThisWeek, completedThisMonth, overdue },
        streak,
        heatmap,
        statusBreakdown,
        recentCompletions: recent,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
