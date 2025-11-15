import React, { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import Toast from '../components/Toast'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
  progress?: boolean // Shows countdown progress
  countdownSeconds?: number
}

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (type: ToastMessage['type'], message: string, options?: {
    duration?: number
    progress?: boolean
    countdownSeconds?: number
  }) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (
    type: ToastMessage['type'],
    message: string,
    options: { duration?: number; progress?: boolean; countdownSeconds?: number } = {}
  ): string => {
    const id = crypto.randomUUID()
    const toast: ToastMessage = {
      id,
      type,
      message,
      duration: options.duration || 3000,
      progress: options.progress,
      countdownSeconds: options.countdownSeconds
    }

    setToasts(prev => [...prev, toast])

    // Auto-remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration)

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}

      {/* Render active toasts */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
            progress={toast.progress ? 100 : undefined}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Convenience hooks
export const useSuccessToast = () => {
  const { showToast } = useToast()
  return (message: string, duration?: number) =>
    showToast('success', message, { duration })
}

export const useErrorToast = () => {
  const { showToast } = useToast()
  return (message: string, duration?: number) =>
    showToast('error', message, { duration })
}

export const useInfoToast = () => {
  const { showToast } = useToast()
  return (message: string, duration?: number) =>
    showToast('info', message, { duration })
}
