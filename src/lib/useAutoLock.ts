import { useState, useEffect, useRef, useCallback } from 'react'

export interface AutoLockConfig {
  timeout: number | false // minutes, false = never
  warningTime: number // seconds before lock to show warning
}

export interface AutoLockState {
  isActive: boolean
  timeRemaining: number
  isWarningVisible: boolean
  timeUntilWarning: number
}

const DEFAULT_CONFIG: AutoLockConfig = {
  timeout: 5, // 5 minutes
  warningTime: 30 // 30 seconds
}

const CONFIG_KEY = 'vault_autolock_config'

/**
 * Auto-lock hook for managing vault session timeout
 */
export function useAutoLock(
  isUnlocked: boolean,
  onLock: () => void,
  config?: Partial<AutoLockConfig>
) {
  const [state, setState] = useState<AutoLockState>({
    isActive: false,
    timeRemaining: 0,
    isWarningVisible: false,
    timeUntilWarning: 0
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const timeoutMs = finalConfig.timeout === false ? false : finalConfig.timeout * 60 * 1000
  const warningMs = finalConfig.warningTime * 1000

  // Load settings from localStorage
  const loadSettings = useCallback(() => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY)
      return stored ? JSON.parse(stored) : finalConfig
    } catch {
      return finalConfig
    }
  }, [finalConfig])

  // Save settings to localStorage
  const saveSettings = useCallback((settings: AutoLockConfig) => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save auto-lock settings:', error)
    }
  }, [])

  // Update settings
  const updateSettings = useCallback((newConfig: Partial<AutoLockConfig>) => {
    const current = loadSettings()
    const updated = { ...current, ...newConfig }
    saveSettings(updated)
    // Force reset if needed
    if (timeoutMs !== false) {
      resetTimer()
    }
  }, [loadSettings, saveSettings, timeoutMs])

  // Get current settings
  const getSettings = useCallback(() => loadSettings(), [loadSettings])

  // Reset activity timer
  const resetTimer = useCallback(() => {
    if (timeoutMs === false || !isUnlocked) return

    lastActivityRef.current = Date.now()
    setState(prev => ({
      ...prev,
      isActive: true,
      timeRemaining: timeoutMs,
      isWarningVisible: false,
      timeUntilWarning: timeoutMs - warningMs
    }))

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)

    // Set warning timer
    warningTimerRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, isWarningVisible: true }))
    }, timeoutMs - warningMs)

    // Set lock timer
    timerRef.current = setTimeout(() => {
      onLock()
    }, timeoutMs)

  }, [timeoutMs, warningMs, isUnlocked, onLock])

  // Activity handler
  const handleActivity = useCallback(() => {
    if (timeoutMs === false || !isUnlocked) return
    resetTimer()
  }, [timeoutMs, isUnlocked, resetTimer])

  // Visibility change handler
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab hidden - clear timers to save resources
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    } else {
      // Tab visible - reset timer
      resetTimer()
    }
  }, [resetTimer])

  // Extend session (called when user clicks "Stay unlocked" in warning)
  const extendSession = useCallback(() => {
    setState(prev => ({ ...prev, isWarningVisible: false }))
    resetTimer()
  }, [resetTimer])

  // Cancel warning and lock immediately
  const cancelWarning = useCallback(() => {
    setState(prev => ({ ...prev, isWarningVisible: false }))
    onLock()
  }, [onLock])

  // Setup event listeners
  useEffect(() => {
    if (!isUnlocked || timeoutMs === false) return

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'wheel',
      'touchstart',
      'touchmove'
    ]

    const eventHandler = () => handleActivity()

    events.forEach(event => {
      document.addEventListener(event, eventHandler, true) // Use capture phase
    })

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Start initial timer
    resetTimer()

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, eventHandler, true)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    }
  }, [isUnlocked, timeoutMs, handleActivity, handleVisibilityChange, resetTimer])

  // Update countdown display
  useEffect(() => {
    if (!state.isActive || !isUnlocked) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, (timeoutMs as number) - elapsed)

      setState(prev => ({
        ...prev,
        timeRemaining: remaining,
        timeUntilWarning: Math.max(0, remaining - warningMs)
      }))

      if (remaining <= 0) {
        onLock()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isActive, isUnlocked, timeoutMs, warningMs, lastActivityRef, onLock])

  return {
    state,
    resetTimer,
    extendSession,
    cancelWarning,
    updateSettings,
    getSettings
  }
}
