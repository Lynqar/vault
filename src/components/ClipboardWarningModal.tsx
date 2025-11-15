import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, X, Shield } from 'lucide-react'

interface ClipboardWarningModalProps {
  isVisible: boolean
  type: 'password' | 'totp' | 'username'
  onClose: () => void
  onConfirm: () => void
  onDontShowAgain?: () => void
}

const ClipboardWarningModal: React.FC<ClipboardWarningModalProps> = ({
  isVisible,
  type,
  onClose,
  onConfirm,
  onDontShowAgain
}) => {
  if (!isVisible) return null

  const getWarningMessage = () => {
    switch (type) {
      case 'password':
        return {
          title: 'Password Copied to Clipboard',
          message: 'Your password is now in your clipboard. Remember to lock your device and clear the clipboard once you\'ve pasted it.',
          icon: Shield,
          severity: 'high'
        }
      case 'totp':
        return {
          title: 'TOTP Code Copied to Clipboard',
          message: 'The 2FA code will remain in your clipboard for 30 seconds before auto-clearing. Don\'t leave your device unattended.',
          icon: AlertTriangle,
          severity: 'medium'
        }
      case 'username':
        return {
          title: 'Username Copied',
          message: 'Your username has been copied. While less sensitive, be mindful of clipboard access.',
          icon: AlertTriangle,
          severity: 'low'
        }
      default:
        return {
          title: 'Data Copied to Clipboard',
          message: 'Remember to clear your clipboard after use for security.',
          icon: AlertTriangle,
          severity: 'low'
        }
    }
  }

  const warning = getWarningMessage()
  const IconComponent = warning.icon

  // Auto-confirm after 3 seconds for low severity
  useEffect(() => {
    if (warning.severity === 'low') {
      const timer = setTimeout(() => {
        onConfirm()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [warning.severity, onConfirm])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-border rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-start space-x-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              warning.severity === 'high' ? 'bg-error/20 text-error' :
              warning.severity === 'medium' ? 'bg-warning/20 text-warning' :
              'bg-info/20 text-info'
            }`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text">{warning.title}</h3>
              <p className="text-sm text-muted mt-1">{warning.message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-muted hover:text-text transition-colors"
              aria-label="Close warning"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col space-y-2">
            {warning.severity === 'high' && (
              <button
                onClick={onConfirm}
                className="w-full bg-accent hover:bg-accent/90 text-text py-2 px-4 rounded-lg transition-colors"
              >
                I Understand
              </button>
            )}

            {warning.severity === 'low' && (
              <p className="text-xs text-center text-muted">
                This warning will close automatically in 3 seconds...
              </p>
            )}

            {onDontShowAgain && warning.severity !== 'high' && (
              <button
                onClick={onDontShowAgain}
                className="w-full text-sm text-muted hover:text-text transition-colors py-1"
              >
                Don't show this warning again
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ClipboardWarningModal
