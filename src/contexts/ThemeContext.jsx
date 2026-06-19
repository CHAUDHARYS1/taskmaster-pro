import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

function getInitialMode() {
  return localStorage.getItem('themeMode') || localStorage.getItem('theme') || 'system'
}

function resolveIsDark(mode) {
  if (mode === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches
  return mode === 'dark'
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(getInitialMode)
  const isDark = resolveIsDark(themeMode)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('themeMode', themeMode)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark, themeMode])

  const setThemeMode = (mode) => setThemeModeState(mode)
  const toggle = () => setThemeModeState(p => p === 'dark' ? 'light' : 'dark')

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
