import { useCallback, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { supabase } from '../lib/supabase'

dayjs.extend(isoWeek)

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
      date:      key,
      count:     inYear ? (countMap[key] ?? 0) : 0,
      dayOfWeek: cursor.day(),
      faded:     !inYear,
    })
    cursor = cursor.add(1, 'day')
  }
  return cells
}

function calculateStreak(completedDates) {
  const dateSet   = new Set(completedDates.map(d => dayjs(d).format('YYYY-MM-DD')))
  const today     = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  let current = 0
  let cursor  = dateSet.has(today) ? dayjs() : dateSet.has(yesterday) ? dayjs().subtract(1, 'day') : null
  if (cursor) {
    while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
      current++
      cursor = cursor.subtract(1, 'day')
    }
  }

  const sorted  = [...dateSet].sort()
  let longest   = 0
  let run       = 0
  let prev      = null
  for (const key of sorted) {
    const d = dayjs(key)
    if (prev && d.diff(prev, 'day') === 1) { run++ }
    else { run = 1 }
    if (run > longest) longest = run
    prev = d
  }

  return { current, longest }
}

// Build 8-week velocity from an array of ISO timestamp strings
function buildWeeklyVelocity(completedDates) {
  const weeks = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = dayjs().startOf('isoWeek').subtract(i, 'week')
    const weekEnd   = weekStart.endOf('isoWeek')
    const count     = completedDates.filter(d => {
      const dd = dayjs(d)
      return !dd.isBefore(weekStart) && !dd.isAfter(weekEnd)
    }).length
    weeks.push({
      label: i === 0 ? 'This wk' : i === 1 ? 'Last wk' : weekStart.format('MMM D'),
      count,
      weekStart: weekStart.format('YYYY-MM-DD'),
    })
  }
  return weeks
}

export function useDashboard(year = 2026) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const today     = dayjs().startOf('day')
      const yearStart = `${year}-01-01T00:00:00.000Z`
      const yearEnd   = `${year + 1}-01-01T00:00:00.000Z`
      const eightWeeksAgo = today.subtract(8, 'week').toISOString()
      const sevenDaysOut  = today.add(7, 'day').format('YYYY-MM-DD')

      const [allTasks, completedInYear, recentDone, dueSoonRes, velocityDates] = await Promise.all([
        // All tasks — status, priority, due_date
        supabase
          .from('tasks')
          .select('id, status, due_date, priority'),

        // Tasks completed in the selected year (heatmap + streak)
        supabase
          .from('tasks')
          .select('completed_at')
          .not('completed_at', 'is', null)
          .gte('completed_at', yearStart)
          .lt('completed_at', yearEnd),

        // Recent completions with text for the feed
        supabase
          .from('tasks')
          .select('id, text, completed_at, status, priority')
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
          .limit(8),

        // Tasks due within the next 7 days (non-done)
        supabase
          .from('tasks')
          .select('id, text, due_date, priority, status')
          .not('status', 'eq', 'done')
          .not('due_date', 'is', null)
          .gte('due_date', today.format('YYYY-MM-DD'))
          .lte('due_date', sevenDaysOut)
          .order('due_date', { ascending: true })
          .limit(10),

        // Completions over last 8 weeks for velocity chart
        supabase
          .from('tasks')
          .select('completed_at')
          .not('completed_at', 'is', null)
          .gte('completed_at', eightWeeksAgo),
      ])

      if (allTasks.error)       throw allTasks.error
      if (completedInYear.error) throw completedInYear.error
      if (recentDone.error)     throw recentDone.error
      if (dueSoonRes.error)     throw dueSoonRes.error
      if (velocityDates.error)  throw velocityDates.error

      const tasks    = allTasks.data ?? []
      const doneItems = completedInYear.data ?? []
      const recent   = recentDone.data ?? []
      const dueSoon  = dueSoonRes.data ?? []
      const velDates = (velocityDates.data ?? []).map(t => t.completed_at)

      const weekStart = today.startOf('week')
      const monStart  = today.startOf('month')

      const totalTasks          = tasks.length
      const totalCompleted      = tasks.filter(t => t.status === 'done').length
      const activeTasks         = totalTasks - totalCompleted
      const completedToday      = doneItems.filter(t => dayjs(t.completed_at).isSame(today, 'day')).length
      const completedThisWeek   = doneItems.filter(t => !dayjs(t.completed_at).isBefore(weekStart)).length
      const completedThisMonth  = doneItems.filter(t => !dayjs(t.completed_at).isBefore(monStart)).length
      const overdue             = tasks.filter(t =>
        t.status !== 'done' && t.due_date && dayjs(t.due_date).isBefore(today)
      ).length

      const activeTasks_ = tasks.filter(t => t.status !== 'done')
      const priorityBreakdown = {
        urgent: activeTasks_.filter(t => t.priority === 'urgent').length,
        high:   activeTasks_.filter(t => t.priority === 'high').length,
        medium: activeTasks_.filter(t => t.priority === 'medium').length,
        low:    activeTasks_.filter(t => t.priority === 'low').length,
        none:   activeTasks_.filter(t => !t.priority).length,
      }

      const statusBreakdown = {
        toDo:       tasks.filter(t => t.status === 'toDo').length,
        inProgress: tasks.filter(t => t.status === 'inProgress').length,
        inReview:   tasks.filter(t => t.status === 'inReview').length,
        done:       totalCompleted,
      }

      const completedDates  = doneItems.map(t => t.completed_at)
      const heatmap         = buildYearHeatmap(completedDates, year)
      const streak          = calculateStreak(completedDates)
      const weeklyVelocity  = buildWeeklyVelocity(velDates)

      setData({
        stats: {
          totalTasks,
          totalCompleted,
          activeTasks,
          completedToday,
          completedThisWeek,
          completedThisMonth,
          overdue,
        },
        streak,
        heatmap,
        statusBreakdown,
        priorityBreakdown,
        recentCompletions: recent,
        dueSoon,
        weeklyVelocity,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}
