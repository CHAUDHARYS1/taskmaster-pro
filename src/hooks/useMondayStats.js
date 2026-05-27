import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { supabase } from '../lib/supabase'

dayjs.extend(isoWeek)

function buildMiniHeatmap(completedDates, weeks = 12) {
  const countMap = {}
  for (const d of completedDates) {
    const key = dayjs(d).format('YYYY-MM-DD')
    countMap[key] = (countMap[key] ?? 0) + 1
  }

  const today       = dayjs()
  const startSunday = today.subtract(weeks, 'week').startOf('week')
  const cells       = []
  for (let i = 0; i < weeks * 7; i++) {
    const date = startSunday.add(i, 'day')
    if (date.isAfter(today)) break
    const key = date.format('YYYY-MM-DD')
    cells.push({ date: key, count: countMap[key] ?? 0 })
  }
  return cells
}

function calcStreak(completedDates) {
  const dateSet  = new Set(completedDates.map(d => dayjs(d).format('YYYY-MM-DD')))
  const today    = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  let current = 0
  let cursor  = dateSet.has(today) ? dayjs() : dateSet.has(yesterday) ? dayjs().subtract(1, 'day') : null
  if (cursor) {
    while (dateSet.has(cursor.format('YYYY-MM-DD'))) {
      current++
      cursor = cursor.subtract(1, 'day')
    }
  }
  return current
}

export function useMondayStats(workspaceId) {
  const [lastWeekCount,    setLastWeekCount]    = useState(0)
  const [miniHeatmapCells, setMiniHeatmapCells] = useState([])
  const [currentStreak,    setCurrentStreak]    = useState(0)
  const [loading,          setLoading]          = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    async function load() {
      setLoading(true)
      const twoWeeksAgo = dayjs().subtract(14, 'day').toISOString()
      const yearAgo     = dayjs().subtract(1, 'year').toISOString()

      // Last week Sun–Sat bounds
      const lastWeekStart = dayjs().subtract(1, 'week').startOf('week')
      const lastWeekEnd   = dayjs().subtract(1, 'week').endOf('week')

      const [recent, historical, archivedRecent, archivedHistorical] = await Promise.all([
        // Live tasks: last 14 days (for last-week count)
        supabase.from('tasks')
          .select('completed_at')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .gte('completed_at', twoWeeksAgo),

        // Live tasks: last year (for heatmap + streak)
        supabase.from('tasks')
          .select('completed_at')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .gte('completed_at', yearAgo),

        // Archived tasks: last 14 days
        supabase.from('archived_tasks')
          .select('completed_at')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .gte('completed_at', twoWeeksAgo),

        // Archived tasks: last year
        supabase.from('archived_tasks')
          .select('completed_at')
          .eq('workspace_id', workspaceId)
          .not('completed_at', 'is', null)
          .gte('completed_at', yearAgo),
      ])

      const recentDates     = [...(recent.data ?? []), ...(archivedRecent.data ?? [])].map(r => r.completed_at)
      const historicalDates = [...(historical.data ?? []), ...(archivedHistorical.data ?? [])].map(r => r.completed_at)

      const lastWeekCount = recentDates.filter(d => {
        const day = dayjs(d)
        return !day.isBefore(lastWeekStart) && !day.isAfter(lastWeekEnd)
      }).length

      setLastWeekCount(lastWeekCount)
      setMiniHeatmapCells(buildMiniHeatmap(historicalDates, 12))
      setCurrentStreak(calcStreak(historicalDates))
      setLoading(false)
    }

    load()
  }, [workspaceId])

  return { lastWeekCount, miniHeatmapCells, currentStreak, loading }
}
