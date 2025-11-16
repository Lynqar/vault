import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  platforms: string[]
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export interface PWAInstallState {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  lastUpdate: Date | null
  promptToInstall: (() => Promise<void>) | null
}

/**
 * PWA install hook for handling install prompts and PWA status
 */
export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const hasStandalone = 'standalone' in window.navigator && (/android|iphone|ipad|ipod/i).test(navigator.userAgent)

      setIsInstalled(isStandalone || (hasStandalone && !!deferredPrompt))
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // PWA update available
    const handlePWAUpdate = () => {
      setLastUpdate(new Date())
    }

    // Online/offline status
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Register Service Worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        // Service worker is ready
      })
    }

    checkInstalled()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', checkInstalled)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    // Workbox update listeners
    window.addEventListener('sw-cached-content', handlePWAUpdate)
    window.addEventListener('sw-new-content-available', handlePWAUpdate)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', checkInstalled)
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
      window.removeEventListener('sw-cached-content', handlePWAUpdate)
      window.removeEventListener('sw-new-content-available', handlePWAUpdate)
    }
  }, [])

  const promptToInstall = async (): Promise<void> => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice

      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error prompting PWA install:', error)
    }
  }

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isOnline,
    lastUpdate,
    promptToInstall: deferredPrompt ? promptToInstall : null
  }
}
