import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  className?: string
  lines?: number
  height?: string
  animate?: boolean
}

/**
 * Skeleton loader for progressive content loading
 * Provides smooth loading states to improve perceived performance
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  className = '',
  lines = 1,
  height = 'h-4',
  animate = true
}) => {
  const skeletonAnimation = {
    background: animate
      ? [
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)'
        ]
      : 'rgba(255,255,255,0.1)',
    backgroundSize: '200% 100%',
    animation: animate ? 'loading 1.5s infinite' : 'none'
  }

  if (lines === 1) {
    return (
      <div className={`bg-glass rounded animate-pulse ${height} ${className}`}>
        <div className="h-full rounded bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`bg-glass rounded ${height} ${
            index === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          }`}
        >
          <div className="h-full rounded bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for vault entry items
 */
export const VaultEntrySkeleton: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-4 rounded-lg bg-surface border border-border"
  >
    <div className="flex items-start space-x-3">
      {/* Favicon skeleton */}
      <SkeletonLoader className="w-6 h-6 rounded" />

      <div className="flex-1 space-y-2">
        {/* Title */}
        <SkeletonLoader className="h-5" />

        {/* URL */}
        <SkeletonLoader className="h-4 w-2/3" />

        {/* Username */}
        <div className="flex items-center space-x-2 mt-2">
          <SkeletonLoader className="w-4 h-4 rounded" />
          <SkeletonLoader className="h-4 w-1/3" />
        </div>

        {/* Password field */}
        <div className="flex items-center space-x-2">
          <SkeletonLoader className="h-4 flex-1" />
          <SkeletonLoader className="w-4 h-4 rounded" />
          <SkeletonLoader className="w-4 h-4 rounded" />
        </div>

        {/* TOTP if present */}
        <div className="flex items-center space-x-2">
          <SkeletonLoader className="w-4 h-4 rounded" />
          <SkeletonLoader className="h-5 w-16 rounded-full" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-1">
        <SkeletonLoader className="w-8 h-8 rounded" />
        <SkeletonLoader className="w-8 h-8 rounded" />
      </div>
    </div>

    {/* Notes and metadata */}
    <div className="mt-3 space-y-1">
      <SkeletonLoader className="h-3 w-full" />
      <SkeletonLoader className="h-3 w-1/2" />
      <div className="flex justify-end mt-2">
        <SkeletonLoader className="h-3 w-20" />
      </div>
    </div>
  </motion.div>
)

/**
 * Loading placeholder for the entire vault
 */
export const VaultSkeleton: React.FC<{ entryCount?: number }> = ({
  entryCount = 5
}) => (
  <main className="container px-6 pt-28 pb-8">
    {/* Header */}
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <SkeletonLoader className="h-12 w-64 mb-2" />
          <SkeletonLoader className="h-4 w-48" />
        </div>
        <SkeletonLoader className="h-12 w-32 rounded-full" />
      </div>

      {/* Search bar */}
      <SkeletonLoader className="h-12 w-full mt-4 rounded-md" />
    </div>

    {/* Entry items */}
    <div className="space-y-4">
      {Array.from({ length: entryCount }).map((_, index) => (
        <VaultEntrySkeleton key={index} />
      ))}
    </div>
  </main>
)

/**
 * Coachmark overlay for first-time users
 */
export interface CoachmarkProps {
  isVisible: boolean
  onDismiss: () => void
  title: string
  content: string
  target: string // CSS selector for target element
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export const Coachmark: React.FC<CoachmarkProps> = ({
  isVisible,
  onDismiss,
  title,
  content,
  target,
  position = 'bottom'
}) => {
  if (!isVisible) return null

  // Position the coachmark relative to target
  // This would need more sophisticated positioning logic in production
  const getPositionStyles = () => {
    const base = 'absolute z-50 bg-surface border border-border rounded-xl shadow-xl p-4 max-w-xs'
    switch (position) {
      case 'top': return `${base} bottom-full left-1/2 transform -translate-x-1/2 mb-2`
      case 'bottom': return `${base} top-full left-1/2 transform -translate-x-1/2 mt-2`
      case 'left': return `${base} right-full top-1/2 transform -translate-y-1/2 mr-2`
      case 'right': return `${base} left-full top-1/2 transform -translate-y-1/2 ml-2`
      default: return base
    }
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop with focus area */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />

      {/* Arrow pointing to target */}
      <div
        className={`absolute ${getPositionStyles()}`}
        style={{
          // In production, calculate position based on target element
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Arrow */}
        <div
          className={`absolute w-3 h-3 bg-surface border transform rotate-45 ${
            position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-l border-b' :
            position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-r border-t' :
            position === 'left' ? '-right-1.5 top-1/2 -translate-y-1/2 border-t border-r' :
            '-left-1.5 top-1/2 -translate-y-1/2 border-b border-l'
          }`}
        />

        {/* Content */}
        <div className="space-y-2 pointer-events-auto">
          <h4 className="font-semibold text-text text-sm">{title}</h4>
          <p className="text-muted text-xs">{content}</p>
          <button
            onClick={onDismiss}
            className="text-accent text-xs font-medium hover:text-accent/80"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoader
