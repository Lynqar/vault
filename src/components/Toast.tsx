import React, { useEffect, useState } from 'react'
import { Check, X, Info } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
  onClose: () => void
  progress?: number // 0-100 for countdown
}

const Toast: React.FC<ToastProps> = ({ type, message, duration = 3000, onClose, progress }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade-out
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 bg-surface p-3 rounded-lg shadow-lynqar-lg border border-white/6 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${type === 'success' ? 'text-text' : type === 'error' ? 'text-red-400' : 'text-text'}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        {type === 'success' ? (
          <Check className="w-4 h-4 text-success" />
        ) : type === 'error' ? (
          <X className="w-4 h-4 text-error" />
        ) : (
          <Info className="w-4 h-4 text-accent" />
        )}
        <span className="flex-1">{message}</span>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-muted hover:text-text transition-colors"
          aria-label="Close toast"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Progress bar for countdown */}
      {progress !== undefined && (
        <div className="w-full bg-muted rounded-full h-1 mt-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              type === 'success' ? 'bg-success' : type === 'error' ? 'bg-error' : 'bg-accent'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default Toast
