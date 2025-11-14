import React, { useState, useEffect } from 'react'
import { VaultProvider, useVault } from './contexts/VaultContext'
import { db } from './lib/db'
import VaultOnboarding from './pages/VaultOnboarding'
import VaultUnlock from './pages/VaultUnlock'
import Vault from './pages/Vault'

type ScreenType = 'onboarding' | 'unlock' | 'vault'

const App: React.FC = () => {
  return (
    <VaultProvider>
      <AppContent />
    </VaultProvider>
  )
}

const AppContent: React.FC = () => {
  const { unlocked } = useVault()
  const [screen, setScreen] = useState<ScreenType>('onboarding')
  const [loading, setLoading] = useState(true)

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
}

export default App
