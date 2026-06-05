import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { supabase } from '../lib/supabase'

function buildYearHeatmap(completedDates, year) {
  const countMap = {}
  for (const d of completedDates) {
    const key = dayjs(d).format('YYYY-MM-DD')
    countMap[key] = (countMap[key] ?? 0) + 1
  }

  const jan1        = dayjs(`${year}-01-01`)
  const dec31       = dayjs(`${year}-12-31`)
  const today       = dayjs()
  const endDate     = dec31.isAfter(today) ? today : dec31
  const startSunday = jan1.startOf('week')

  const cells = []
  let cursor = startSunday
  while (!cursor.isAfter(endDate)) {
    const key    = cursor.format('YYYY-MM-DD')
    const inYear = cursor.year() === year
    cells.push({
      date:       key,
      count:      inYear ? (countMap[key] ?? 0) : 0,
      dayOfWeek:  cursor.day(),
      faded:      !inYear,
    })
    cursor = cursor.add(1, 'day')
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

export function useDashboard(year = 2026) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const yearStart = `${year}-01-01T00:00:00.000Z`
      const yearEnd   = `${year + 1}-01-01T00:00:00.000Z`

      const [allTasks, completedInYear, recentDone] = await Promise.all([
        // All tasks across all workspaces (RLS scopes to accessible ones)
        supabase
          .from('tasks')
          .select('id, status, due_date, completed_at'),

        // Completed tasks in the selected year (for heatmap + streak + year stats)
        supabase
          .from('tasks')
          .select('completed_at')
          .not('completed_at', 'is', null)
          .gte('completed_at', yearStart)
          .lt('completed_at', yearEnd),

        // Recent completions with text for the activity feed
        supabase
          .from('tasks')
          .select('id, text, completed_at, status')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(8),
      ])

      if (allTasks.error)       throw allTasks.error
      if (completedInYear.error) throw completedInYear.error
      if (recentDone.error)     throw recentDone.error

      const tasks     = allTasks.data ?? []
      const doneItems = completedInYear.data ?? []
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
      const heatmap        = buildYearHeatmap(completedDates, year)
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
  }, [year])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
