import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type, message, duration) => {
    const id = ++_id
    const ms = duration ?? (type === 'error' ? 5000 : 3500)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => dismiss(id), ms)
  }, [dismiss])

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error:   (msg, dur) => addToast('error',   msg, dur),
    info:    (msg, dur) => addToast('info',    msg, dur),
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
