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

    // Update CSS custom properties - use our unified color system
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      // Dark theme - keep our beautiful design colors
      root.style.setProperty('--bg', '#000000')
      root.style.setProperty('--surface', '#0f0f0f')
      root.style.setProperty('--text', '#ffffff')
      root.style.setProperty('--muted', '#d1d5db')
      root.style.setProperty('--accent', '#a78bfa')
      root.style.setProperty('--accent-start', '#ffffff')
      root.style.setProperty('--accent-end', '#c4b5fd')
      root.style.setProperty('--border', '#333333')
      root.style.setProperty('--card', '#0f0f0f')
      root.style.setProperty('--grad-start', '#ffffff')
      root.style.setProperty('--grad-end', '#c4b5fd')
      root.style.setProperty('--text-muted', '#d1d5db')
      root.style.setProperty('--success', '#10b981')
      root.style.setProperty('--error', '#ef4444')
    } else {
      // Light theme - contrasting colors for light background
      root.style.setProperty('--bg', '#f8fafc')           // very light gray-blue
      root.style.setProperty('--surface', '#ffffff')     // pure white
      root.style.setProperty('--text', '#0b1220')        // dark blue-gray
      root.style.setProperty('--muted', '#64748b')       // medium gray-blue
      root.style.setProperty('--accent', '#a78bfa')      // keep purple accent
      root.style.setProperty('--accent-start', '#e879f9')  // rose purple
      root.style.setProperty('--accent-end', '#8b5cf6')    // purple
      root.style.setProperty('--border', '#e2e8f0')      // light gray border
      root.style.setProperty('--card', '#ffffff')        // white cards
      root.style.setProperty('--grad-start', '#0b1220')    // dark text for gradients
      root.style.setProperty('--grad-end', '#64748b')      // muted gray
      root.style.setProperty('--text-muted', '#64748b')   // muted text
      root.style.setProperty('--success', '#059669')     // green-700 for light
      root.style.setProperty('--error', '#dc2626')       // red-600 for light
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
