import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import dayjs from 'dayjs'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications,  setNotifications]  = useState([])
  const [preferences,    setPreferences]    = useState(null)
  const [panelOpen,      setPanelOpen]      = useState(false)
  const [mobileNotifOpen, setMobileNotifOpen] = useState(false)
  const dueDateCheckedRef = useRef(false)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(first_name, last_name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    setNotifications(data ?? [])
  }, [user])

  const fetchPreferences = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()
    if (data) {
      setPreferences(data)
    } else {
      const defaults = {
        user_id: user.id,
        task_assigned: true, task_moved: true, task_completed: false,
        comment_added: true, mention: true,
        due_soon: true, overdue: true,
        member_joined: true, member_removed: true, workspace_renamed: false,
      }
      const { data: ins } = await supabase
        .from('notification_preferences').insert(defaults).select().single()
      setPreferences(ins ?? defaults)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setPreferences(null)
      dueDateCheckedRef.current = false
      return
    }
    fetchNotifications()
    fetchPreferences()

    const ch = supabase
      .channel(`notif_${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: n }) => setNotifications(prev => [n, ...prev].slice(0, 100)))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ new: n }) => setNotifications(prev => prev.map(x => x.id === n.id ? n : x)))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        ({ old: n }) => setNotifications(prev => prev.filter(x => x.id !== n.id)))
      .subscribe()

    return () => supabase.removeChannel(ch)
  }, [user, fetchNotifications, fetchPreferences])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // Insert a notification for any user (or self — preference gate applied)
  const notify = useCallback(async (notif) => {
    if (!user) return
    // If notifying self, check preferences
    if (notif.user_id === user.id && preferences) {
      if (preferences[notif.type] === false) return
    }
    await supabase.from('notifications').insert({
      user_id:      notif.user_id,
      workspace_id: notif.workspace_id ?? null,
      type:         notif.type,
      title:        notif.title,
      body:         notif.body ?? null,
      task_id:      notif.task_id ?? null,
      actor_id:     notif.actor_id ?? user.id,
      metadata:     notif.metadata ?? null,
    })
  }, [user, preferences])

  const markRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }, [user])

  const clearRead = useCallback(async () => {
    if (!user) return
    setNotifications(prev => prev.filter(n => !n.read))
    await supabase.from('notifications').delete().eq('user_id', user.id).eq('read', true)
  }, [user])

  const clearAll = useCallback(async () => {
    if (!user) return
    setNotifications([])
    await supabase.from('notifications').delete().eq('user_id', user.id)
  }, [user])

  const savePreferences = useCallback(async (patch) => {
    if (!user) return
    setPreferences(prev => ({ ...prev, ...patch }))
    await supabase.from('notification_preferences').upsert({ user_id: user.id, ...patch })
  }, [user])

  // Check tasks for due-soon / overdue — call once after tasks load
  const checkDueDates = useCallback(async (tasks) => {
    if (!user || dueDateCheckedRef.current) return
    if (preferences === null) return // preferences not yet loaded
    if (!preferences.due_soon && !preferences.overdue) {
      dueDateCheckedRef.current = true
      return
    }
    dueDateCheckedRef.current = true

    const now  = dayjs()
    const soon = now.add(24, 'hour')

    const relevant = tasks.filter(t =>
      t.due_date && t.status !== 'done' && !t.archived &&
      (t.assignee_id === user.id || t.created_by === user.id) &&
      dayjs(t.due_date).isBefore(soon)
    )
    if (!relevant.length) return

    const today = now.format('YYYY-MM-DD')
    const { data: existing } = await supabase
      .from('notifications')
      .select('task_id, type')
      .eq('user_id', user.id)
      .in('type', ['due_soon', 'overdue'])
      .gte('created_at', `${today}T00:00:00Z`)

    const sent = new Set((existing ?? []).map(n => `${n.task_id}:${n.type}`))
    const toInsert = []

    for (const t of relevant) {
      const due = dayjs(t.due_date)
      const isOverdue = due.isBefore(now, 'day')

      if (isOverdue && preferences.overdue && !sent.has(`${t.id}:overdue`)) {
        toInsert.push({
          user_id: user.id, workspace_id: t.workspace_id, type: 'overdue',
          title: 'Task overdue',
          body: `"${t.text}" was due ${due.format('MMM D')}`,
          task_id: t.id, actor_id: null,
        })
      } else if (!isOverdue && preferences.due_soon && !sent.has(`${t.id}:due_soon`)) {
        toInsert.push({
          user_id: user.id, workspace_id: t.workspace_id, type: 'due_soon',
          title: 'Task due soon',
          body: `"${t.text}" is due ${due.isSame(now, 'day') ? 'today' : 'tomorrow'}`,
          task_id: t.id, actor_id: null,
        })
      }
    }

    if (toInsert.length > 0) {
      await supabase.from('notifications').insert(toInsert)
    }
  }, [user, preferences])

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, panelOpen,
      openPanel:   () => setPanelOpen(true),
      closePanel:  () => setPanelOpen(false),
      togglePanel: () => setPanelOpen(p => !p),
      mobileNotifOpen,
      openMobile:  () => setMobileNotifOpen(true),
      closeMobile: () => setMobileNotifOpen(false),
      notify, markRead, markAllRead, clearRead, clearAll,
      preferences, savePreferences, checkDueDates,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
