import React from 'react'

export const Card: React.FC<{
  children: React.ReactNode
  className?: string
}> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface backdrop-blur-sm border border-border rounded-xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export const Button: React.FC<{
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  onClick?: () => void
}> = ({ children, type = 'button', disabled = false, className = '', onClick }) => {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 bg-primary hover:bg-primary/80 disabled:bg-muted disabled:cursor-not-allowed text-text rounded-lg transition-colors font-medium ${className}`}
    >
      {children}
    </button>
  )
}
