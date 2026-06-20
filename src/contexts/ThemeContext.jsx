import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

const MQ = () => window.matchMedia('(prefers-color-scheme: dark)')

function getInitialMode() {
  return localStorage.getItem('themeMode') || localStorage.getItem('theme') || 'system'
}

export function ThemeProvider({ children }) {
  const [themeMode,  setThemeModeState] = useState(getInitialMode)
  const [systemDark, setSystemDark]     = useState(() => MQ().matches)

  // Track OS preference changes in real time
  useEffect(() => {
    const mq      = MQ()
    const handler = (e) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark'

  // Apply to DOM + persist whenever resolved value changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('themeMode', themeMode)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark, themeMode])

  const setThemeMode = (mode) => setThemeModeState(mode)
  // Cycle: system → dark → light → system
  const toggle = () => setThemeModeState(p =>
    p === 'system' ? 'dark' : p === 'dark' ? 'light' : 'system'
  )

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, toggle, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
