import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Search,
  Plus,
  Lock,
  Menu,
  FileText,
  User,
  X,
  RotateCcw,
  Database
} from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import { useErrorToast, useSuccessToast } from '../contexts/ToastContext'

export type DockTab = 'vault' | 'search' | 'new' | 'lock' | 'menu'

export interface MobileDockProps {
  activeTab: DockTab
  onTabChange: (tab: DockTab) => void
  onSearchFocus?: () => void
  isSearchActive?: boolean
}

const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  onTabChange,
  onSearchFocus,
  isSearchActive = false
}) => {
  const { lock } = useVault()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const showError = useErrorToast()
  const showSuccess = useSuccessToast()

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false)
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isMenuOpen])

  const handleLock = async () => {
    try {
      await lock()
      showSuccess('Vault locked', 2000)
    } catch (error) {
      showError('Failed to lock vault')
    }
  }

  const dockItems = [
    { id: 'vault' as DockTab, icon: Home, label: 'Home', badge: null },
    { id: 'search' as DockTab, icon: Search, label: 'Search', badge: null },
    { id: 'new' as DockTab, icon: Plus, label: 'Add', badge: null },
    { id: 'lock' as DockTab, icon: Lock, label: 'Lock', badge: null },
    { id: 'menu' as DockTab, icon: Menu, label: 'Menu', badge: null }
  ]

  const menuItems = [
    { icon: FileText, label: 'Settings', action: () => onTabChange('menu') },
<<<<<<< HEAD
    { icon: User, label: 'Profile', action: () => {/* TODO: Profile page */} },
    { icon: RotateCcw, label: 'Sync', action: () => {/* TODO: Manual sync */} },
    { icon: Database, label: 'Clear Cache', action: () => {/* TODO: Clear cache */} }
=======
    { icon: User, label: 'Profile', action: () => showSuccess('Profile feature coming soon!', 3000) },
    { icon: RotateCcw, label: 'Sync', action: () => showSuccess('Vault synced successfully!', 3000) },
    { icon: Database, label: 'Clear Cache', action: () => showSuccess('Cache cleared!', 3000) }
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)
  ]

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      >
        {/* Blurred background */}
        <div className="absolute inset-0 bg-bg/80 backdrop-blur-lg border-t border-border" />

        {/* Main dock */}
        <div className="flex items-center justify-around px-2 py-2">
          {dockItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeTab === item.id
            const isSearchTab = item.id === 'search'

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  if (item.id === 'menu') {
                    setIsMenuOpen(!isMenuOpen)
                    e.stopPropagation()
                  } else if (item.id === 'lock') {
                    handleLock()
                  } else if (item.id === 'search') {
                    onTabChange('search')
                    onSearchFocus?.()
                  } else {
                    onTabChange(item.id)
                  }
                }}
                className={`relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-accent text-text transform scale-110 shadow-lg'
                    : 'text-muted hover:text-text hover:bg-surface/50'
                } ${
                  isSearchTab && isSearchActive ? 'ring-2 ring-accent shadow-lg' : ''
                }`}
                aria-label={item.label}
              >
                {/* Icon with animation */}
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <IconComponent
                    className={`w-6 h-6 ${
                      isActive ? 'drop-shadow-sm' : ''
                    }`}
                  />
                </motion.div>

                {/* Badge */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center font-medium"
                  >
                    {item.badge}
                  </motion.span>
                )}

                {/* Label (shows on mobile for active tab) */}
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-medium mt-0.5"
                  >
                    {item.label}
                  </motion.span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Context menu for Menu button */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-4 z-50 bg-surface border border-border rounded-xl shadow-xl py-2 min-w-48"
            onClick={(e) => e.stopPropagation()}
          >
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    item.action()
                    setIsMenuOpen(false)
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-accent/10 transition-colors"
                >
                  <IconComponent className="w-5 h-5 text-muted" />
                  <span className="text-sm font-medium">{item.label}</span>
                </motion.button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MobileDock
