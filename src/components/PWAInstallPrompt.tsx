import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Smartphone, Monitor } from 'lucide-react'
import { usePWAInstall } from '../lib/usePWAInstall'
import { Button } from '../ui'

const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, promptToInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  if (!isInstallable || dismissed) return null

  const handleInstall = async () => {
    if (!promptToInstall) return

    try {
      setInstalling(true)
      await promptToInstall()
      setDismissed(true)
    } catch (error) {
      console.error('Failed to install PWA:', error)
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:bottom-4 md:max-w-sm"
      >
        <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl p-4">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-indigo-400" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">
                Install Password Vault
              </h3>

              <p className="text-slate-300 text-sm mb-3">
                Get the best experience by installing our secure offline password manager app.
              </p>

              {/* Features */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  <Smartphone className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Mobile</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">Desktop</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleInstall}
                  disabled={installing}
                  className="flex-1 text-sm"
                >
                  {installing ? 'Installing...' : 'Install App'}
                </Button>
                <Button
                  onClick={handleDismiss}
                  className="bg-slate-600 hover:bg-slate-500 text-sm"
                >
                  Not Now
                </Button>
              </div>
            </div>
          </div>

          {/* Install instructions for mobile */}
          <div className="mt-3 pt-3 border-t border-slate-600/30">
            <p className="text-xs text-slate-400">
              On mobile: Tap share button → Add to Home Screen
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PWAInstallPrompt
