import { useEffect, useRef } from 'react'
import dayjs from 'dayjs'

const reminded = new Map()  // taskId → dayjs when last reminded
const snoozed  = new Map()  // taskId → dayjs snoozeUntil

const FIRE_WINDOW_MIN = 2   // minutes around due time for initial fire
const SNOOZE_MIN      = 15  // snooze / post-move re-notify delay
const COOLDOWN_MIN    = 30  // prevent rapid re-fire after reminding

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

export function useTaskReminders(tasks, toast, updateTask, columns, prefs) {
  const tasksRef   = useRef(tasks)
  const toastRef   = useRef(toast)
  const updateRef  = useRef(updateTask)
  const columnsRef = useRef(columns)

  useEffect(() => { tasksRef.current   = tasks      }, [tasks])
  useEffect(() => { toastRef.current   = toast      }, [toast])
  useEffect(() => { updateRef.current  = updateTask }, [updateTask])
  useEffect(() => { columnsRef.current = columns    }, [columns])

  useEffect(() => {
    function check() {
      if (prefs?.inAppReminders === false) return

      const now   = dayjs()
      const today = now.format('YYYY-MM-DD')

      for (const task of tasksRef.current) {
        if (!task.due_date || !task.due_time) continue
        if (task.status === 'done') continue

        const snoozeUntil   = snoozed.get(task.id)
        const snoozePending = snoozeUntil && now.isBefore(snoozeUntil)
        const snoozeDone    = snoozeUntil && !snoozePending

        // Still in snooze window — skip
        if (snoozePending) continue

        const dueAt      = dayjs(`${task.due_date}T${task.due_time}`)
        const minutesOff = now.diff(dueAt, 'minute')  // positive = past due

        // For non-snoozed tasks: must be today and within the fire window
        if (!snoozeDone) {
          if (task.due_date !== today) continue
          if (Math.abs(minutesOff) > FIRE_WINDOW_MIN) continue
        }

        // Cooldown — don't re-fire too soon after last reminder
        const lastReminded = reminded.get(task.id)
        if (lastReminded && now.diff(lastReminded, 'minute') < COOLDOWN_MIN) continue

        // Ready to fire
        snoozed.delete(task.id)
        reminded.set(task.id, now)

        playReminderSound()

        const dueLabel = dueAt.format('h:mm A')
        const message  = snoozeDone
          ? `Reminder: "${task.text}" (was due at ${dueLabel})`
          : minutesOff > 0
            ? `"${task.text}" was due at ${dueLabel}`
            : `"${task.text}" is due at ${dueLabel}`

        const moveOptions = (columnsRef.current ?? [])
          .filter(c => c.id !== task.status && c.id !== 'done')
          .map(c => ({ value: c.id, label: c.label }))

        toastRef.current?.info(message, {
          duration: 30000,
          selectAction: moveOptions.length > 0 ? {
            placeholder: 'Move to...',
            options: moveOptions,
            onChange: (newStatus) => {
              updateRef.current?.(task.id, { status: newStatus })
              // Re-queue a reminder after SNOOZE_MIN so the user gets nudged again
              snoozed.set(task.id, dayjs().add(SNOOZE_MIN, 'minute'))
              reminded.delete(task.id)
            },
          } : null,
          actions: [
            {
              label: 'Snooze 15m',
              onClick: () => {
                snoozed.set(task.id, dayjs().add(SNOOZE_MIN, 'minute'))
                reminded.delete(task.id)
              },
            },
            {
              label: 'Done',
              onClick: () => updateRef.current?.(task.id, { status: 'done' }),
            },
          ],
        })
      }
    }

    check()
    const id = setInterval(check, 60_000)
    return () => clearInterval(id)
  }, [])
}
