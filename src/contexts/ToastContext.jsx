import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type, message, { duration, action, actions, selectAction } = {}) => {
    const id = ++_id
    const ms = duration ?? (type === 'error' ? 5000 : 3500)
    setToasts(prev => [...prev, { id, type, message, action, actions, selectAction }])
    if (ms > 0) timers.current[id] = setTimeout(() => dismiss(id), ms)
    return id
  }, [dismiss])

  const toast = {
    success: (msg, opts)  => addToast('success', msg, typeof opts === 'object' ? opts : { duration: opts }),
    error:   (msg, opts)  => addToast('error',   msg, typeof opts === 'object' ? opts : { duration: opts }),
    info:    (msg, opts)  => addToast('info',    msg, typeof opts === 'object' ? opts : { duration: opts }),
    // Convenience: toast.undo('message', onUndo) — 4-second action toast
    undo: (msg, onUndo) => addToast('info', msg, {
      duration: 4000,
      action: { label: 'Undo', onClick: onUndo },
    }),
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
