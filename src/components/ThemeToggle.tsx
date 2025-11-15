import React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'
import { Button } from '../ui'

// Theme icons mapping
const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor
}

// Theme labels mapping
const themeLabels = {
  light: 'Light Mode',
  dark: 'Dark Mode',
  system: 'System'
}

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'minimal'
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'minimal' }) => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme()

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
  }

  if (variant === 'minimal') {
    const CurrentIcon = themeIcons[theme]
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface/50 transition-all duration-200 group"
        title={`Current: ${themeLabels[theme]} (${actualTheme}). Click to toggle.`}
      >
        <CurrentIcon className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
      </button>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className="w-10 h-10 p-0 rounded-lg bg-accent hover:bg-accent/80 text-text transition-colors flex items-center justify-center"
        title={`Current: ${themeLabels[theme]}. Click to toggle.`}
      >
        {actualTheme === 'dark' ? (
          <Sun className="w-5 h-5" />
        ) : (
          <Moon className="w-5 h-5" />
        )}
      </button>
    )
  }

  if (variant === 'dropdown') {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
      <div className="relative">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2"
        >
          <span className="capitalize">{theme}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-xl border border-border z-20">
              <div className="p-1">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((option) => {
                  const Icon = themeIcons[option]
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        handleThemeChange(option)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                        theme === option
                          ? 'bg-accent/20 text-accent'
                          : 'text-muted hover:bg-surface/50 hover:text-text'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="capitalize">{themeLabels[option]}</span>
                      {option === 'system' && (
                        <span className="text-xs text-muted ml-auto">
                          ({actualTheme})
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Footer info */}
              <div className="px-3 py-2 border-t border-border text-xs text-muted">
                Current: {actualTheme} mode
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return null
}

export default ThemeToggle
