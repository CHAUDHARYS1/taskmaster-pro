import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'

// Module-level maps persist for the page session without causing re-renders
const reminded = new Map()   // taskId → timestamp when last reminded
const snoozed  = new Map()   // taskId → snoozeUntil timestamp

const REMIND_WINDOW_MIN = 10   // fire when ≤ 10 minutes until due
const SNOOZE_MIN        = 10   // snooze delay in minutes

function playReminderSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ;[[880, 0, 0.18], [1108, 0.18, 0.18]].forEach(([freq, delay, dur]) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + delay)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delay + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur)
      osc.start(ctx.currentTime + delay)
      osc.stop(ctx.currentTime + delay + dur + 0.05)
    })
  } catch { /* silently skip if audio unavailable */ }
}

export function useTaskReminders(tasks, toast) {
  // Keep a stable ref to the latest tasks so the interval doesn't go stale
  const tasksRef = useRef(tasks)
  useEffect(() => { tasksRef.current = tasks }, [tasks])

  const toastRef = useRef(toast)
  useEffect(() => { toastRef.current = toast }, [toast])

  useEffect(() => {
    function check() {
      const now = dayjs()
      const today = now.format('YYYY-MM-DD')

      for (const task of tasksRef.current) {
        if (!task.due_date || !task.due_time) continue
        if (task.status === 'done') continue
        if (task.due_date !== today) continue

        const dueAt       = dayjs(`${task.due_date}T${task.due_time}`)
        const minutesLeft = dueAt.diff(now, 'minute')

        if (minutesLeft < 0 || minutesLeft > REMIND_WINDOW_MIN) continue

        // Skip if snoozed and snooze hasn't expired
        const snoozeUntil = snoozed.get(task.id)
        if (snoozeUntil && now.isBefore(snoozeUntil)) continue

        // Skip if already reminded in the last REMIND_WINDOW_MIN minutes
        // (prevents repeated firing during the same window)
        const lastReminded = reminded.get(task.id)
        if (lastReminded && now.diff(lastReminded, 'minute') < REMIND_WINDOW_MIN) continue

        reminded.set(task.id, now)
        snoozed.delete(task.id)

        playReminderSound()

        const dueLabel    = dueAt.format('h:mm A')
        const timeLeft    = minutesLeft === 0 ? 'now' : `in ${minutesLeft} min`
        const message     = `"${task.text}" is due ${timeLeft} (${dueLabel})`

        toastRef.current?.info(message, {
          duration: 20000,
          action: {
            label: 'Snooze',
            onClick: () => {
              snoozed.set(task.id, dayjs().add(SNOOZE_MIN, 'minute'))
              reminded.delete(task.id)
            },
          },
        })
      }
    }

    check() // run once immediately on mount
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, []) // empty deps — uses refs internally
}
