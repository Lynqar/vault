import React, { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: ThemeMode
  actualTheme: 'light' | 'dark' // resolved theme (light/dark)
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY = 'vault_theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('dark') // default to dark since our design is dark-first

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Default to system preference
      applyTheme('system')
    }
  }, [])

  const applyTheme = (newTheme: ThemeMode) => {
    let resolvedTheme: 'light' | 'dark'

    if (newTheme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolvedTheme = newTheme
    }

    setActualTheme(resolvedTheme)

    // Update document class for Tailwind CSS
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')

    // Update CSS custom properties
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      // Dark theme CSS variables
      root.style.setProperty('--bg-primary', 'rgb(15, 23, 42)') // slate-900
      root.style.setProperty('--bg-secondary', 'rgb(30, 41, 59)') // slate-800
      root.style.setProperty('--bg-tertiary', 'rgb(51, 65, 85)') // slate-700
      root.style.setProperty('--bg-accent', 'rgb(100, 116, 139)') // slate-500
      root.style.setProperty('--text-primary', 'rgb(248, 250, 252)') // slate-50
      root.style.setProperty('--text-secondary', 'rgb(203, 213, 225)') // slate-300
      root.style.setProperty('--text-muted', 'rgb(148, 163, 184)') // slate-400
      root.style.setProperty('--border-primary', 'rgb(51, 65, 85)') // slate-700
      root.style.setProperty('--border-secondary', 'rgb(71, 85, 105)') // slate-600
      root.style.setProperty('--accent-primary', 'rgb(96, 165, 250)') // indigo-400
      root.style.setProperty('--accent-secondary', 'rgb(59, 130, 246)') // indigo-500
    } else {
      // Light theme CSS variables
      root.style.setProperty('--bg-primary', 'rgb(255, 255, 255)') // white
      root.style.setProperty('--bg-secondary', 'rgb(248, 250, 252)') // gray-50
      root.style.setProperty('--bg-tertiary', 'rgb(241, 245, 249)') // gray-100
      root.style.setProperty('--bg-accent', 'rgb(148, 163, 184)') // gray-500
      root.style.setProperty('--text-primary', 'rgb(15, 23, 42)') // gray-900
      root.style.setProperty('--text-secondary', 'rgb(55, 65, 81)') // gray-700
      root.style.setProperty('--text-muted', 'rgb(107, 114, 128)') // gray-500
      root.style.setProperty('--border-primary', 'rgb(229, 231, 235)') // gray-200
      root.style.setProperty('--border-secondary', 'rgb(209, 213, 219)') // gray-300
      root.style.setProperty('--accent-primary', 'rgb(59, 130, 246)') // blue-500
      root.style.setProperty('--accent-secondary', 'rgb(37, 99, 235)') // blue-600
    }
  }

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_KEY, newTheme)
    applyTheme(newTheme)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => applyTheme('system')

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{
      theme,
      actualTheme,
      setTheme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
