import React, { useState, useEffect } from 'react'
import { VaultProvider, useVault } from './contexts/VaultContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useAutoLock } from './lib/useAutoLock'
import { db } from './lib/db'
import VaultOnboarding from './pages/VaultOnboarding'
import VaultUnlock from './pages/VaultUnlock'
import Vault from './pages/Vault'
import AutoLockWarningModal from './components/AutoLockWarningModal'
import PWAInstallPrompt from './components/PWAInstallPrompt'

type ScreenType = 'onboarding' | 'unlock' | 'vault'

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </ThemeProvider>
  )
}

const AppContent: React.FC = () => {
  const { unlocked, lock } = useVault()
  const [screen, setScreen] = useState<ScreenType>('onboarding')
  const [loading, setLoading] = useState(true)

  // Auto-lock hook only active when vault is unlocked
  const { state: autoLockState, extendSession, cancelWarning } = useAutoLock(unlocked, lock)

  useEffect(() => {
    const checkScreen = async () => {
      try {
        const saltRow = await db.meta.get('salt')
        if (!saltRow) {
          setScreen('onboarding')
        } else if (!unlocked) {
          setScreen('unlock')
        } else {
          setScreen('vault')
        }
      } catch (error) {
        console.error('Error checking screen:', error)
      } finally {
        setLoading(false)
      }
    }

    checkScreen()
  }, [unlocked])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  // Calculate warning time in seconds (autoLockState.timeRemaining is in ms)
  const warningTimeSeconds = autoLockState.isWarningVisible
    ? Math.ceil(autoLockState.timeRemaining / 1000) || 30
    : 30

  return (
    <>
      {(() => {
        switch (screen) {
          case 'onboarding':
            return <VaultOnboarding />
          case 'unlock':
            return <VaultUnlock />
          case 'vault':
            return <Vault />
          default:
            return <VaultOnboarding />
        }
      })()}

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Auto-lock warning modal - shows on top of any screen */}
      <AutoLockWarningModal
        isVisible={autoLockState.isWarningVisible}
        timeRemaining={warningTimeSeconds}
        onExtend={extendSession}
        onLockNow={cancelWarning}
      />
    </>
  )
}

export default App
