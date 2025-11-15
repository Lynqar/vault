import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Download, Wifi, WifiOff, Clock, CheckCircle, X } from 'lucide-react'
import { usePWAInstall } from '../lib/usePWAInstall'
import { Button } from '../ui'

interface EnhancedPWAInstallProps {
  isVisible?: boolean
  onClose?: () => void
}

/**
 * Enhanced PWA install prompt with offline indicators
 */
const EnhancedPWAInstall: React.FC<EnhancedPWAInstallProps> = ({
  isVisible = true,
  onClose
}) => {
  const { isInstallable, isInstalled, isOnline, promptToInstall } = usePWAInstall()
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [engagementCount, setEngagementCount] = useState(0)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Track user engagement for install prompt timing
    const count = parseInt(localStorage.getItem('vault_user_engagement') || '0', 10)
    setEngagementCount(count)

    // Show install prompt after 3 engagements and if not already dismissed
    if (count >= 3 && isInstallable && !localStorage.getItem('pwa_install_prompt_dismissed')) {
      // Small delay to not interrupt immediate actions
      setTimeout(() => setShowInstallPrompt(true), 2000)
    }
  }, [isInstallable])

  const handleInstall = async () => {
    try {
      setInstalling(true)
      await promptToInstall?.()
      setShowInstallPrompt(false)
      // Mark as dismissed to prevent showing again
      localStorage.setItem('pwa_install_prompt_dismissed', 'true')
    } catch (error) {
      console.error('PWA install failed:', error)
    } finally {
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    localStorage.setItem('pwa_install_prompt_dismissed', 'true')
    onClose?.()
  }

  // Offline indicator
  const offlineIndicator = (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-full text-sm font-medium shadow-lg border ${
        isOnline
          ? 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800'
          : 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-800'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {!isOnline && (
          <span className="text-xs opacity-75">
            Changes will sync when reconnected
          </span>
        )}
      </div>
    </motion.div>
  )

  // PWA install prompt modal
  const installPrompt = (
    <AnimatePresence>
      {showInstallPrompt && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowInstallPrompt(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-accent/10 to-accent/5 p-6 pb-4">
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-2 text-muted hover:text-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", damping: 10 }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/20 flex items-center justify-center"
              >
                <Smartphone className="w-8 h-8 text-accent" />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-bold text-text text-center mb-2"
              >
                Install Lynqar
              </motion.h3>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted text-sm text-center"
              >
                Add to your home screen for offline access
              </motion.p>
            </div>

            {/* Benefits list */}
            <div className="px-6 py-4 space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3"
              >
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm text-text">Fast, app-like experience</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center space-x-3"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <WifiOff className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-text">Work offline, sync when online</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center space-x-3"
              >
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-text">Instant loading, no internet needed</span>
              </motion.div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 space-y-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="w-full py-3 bg-accent hover:bg-accent/90 text-text font-medium"
                >
                  {installing ? (
                    <div className="flex items-center space-x-3 justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text"></div>
                      <span>Installing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 justify-center">
                      <Download className="w-4 h-4" />
                      <span>Add to Home Screen</span>
                    </div>
                  )}
                </Button>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={handleDismiss}
                className="w-full py-2 text-muted hover:text-text transition-colors text-sm"
              >
                Maybe later
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Always show offline indicator */}
      {!isOnline && offlineIndicator}

      {/* Show install prompt when appropriate */}
      {installPrompt}
    </>
  )
}

export default EnhancedPWAInstall
