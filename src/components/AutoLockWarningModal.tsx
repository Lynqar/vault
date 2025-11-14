import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock, Lock } from 'lucide-react'
import { Button } from '../ui'

interface AutoLockWarningModalProps {
  isVisible: boolean
  timeRemaining: number // seconds
  onExtend: () => void
  onLockNow: () => void
}

const AutoLockWarningModal: React.FC<AutoLockWarningModalProps> = ({
  isVisible,
  timeRemaining,
  onExtend,
  onLockNow
}) => {
  const [countdown, setCountdown] = useState(timeRemaining)

  useEffect(() => {
    setCountdown(timeRemaining)
  }, [timeRemaining])

  useEffect(() => {
    if (!isVisible || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isVisible, countdown])

  if (!isVisible) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl shadow-xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Auto-Lock Warning</h3>
                <p className="text-slate-400 text-sm">Vault will lock automatically</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-2xl font-mono font-bold text-white">
                  {formatTime(countdown)}
                </span>
                <span className="text-slate-400 text-sm">remaining</span>
              </div>

              <p className="text-slate-300 text-sm mb-6">
                Due to inactivity, your vault will be locked automatically to protect your data.
              </p>

              {/* Security note */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
                <p className="text-blue-300 text-xs">
                  💡 This is a security feature. Any activity will extend your session.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 p-6 border-t border-slate-700">
            <Button
              onClick={onLockNow}
              className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30"
            >
              <Lock className="w-4 h-4 mr-2" />
              Lock Now
            </Button>
            <Button
              onClick={onExtend}
              className="flex-1"
            >
              Stay Unlocked
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AutoLockWarningModal
