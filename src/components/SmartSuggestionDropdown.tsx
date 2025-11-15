import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import type { VaultEntry } from '../vault'

interface SmartSuggestionDropdownProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  visible: boolean
  position?: 'top' | 'bottom'
  onClose: () => void
}

const SmartSuggestionDropdown: React.FC<SmartSuggestionDropdownProps> = ({
  suggestions,
  onSelect,
  visible,
  position = 'bottom',
  onClose
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions, visible])

  useEffect(() => {
    if (!visible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            onSelect(suggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex, visible, onSelect, onClose])

  if (!visible || suggestions.length === 0) return null

  const positionClasses = position === 'top'
    ? 'bottom-full mb-1'
    : 'top-full mt-1'

  return (
    <AnimatePresence>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: position === 'top' ? 5 : -5, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className={`absolute left-0 right-0 z-50 ${positionClasses}`}
      >
        <div className="bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border-b border-border">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Smart Suggestions</span>
          </div>

          {/* Suggestions */}
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              onClick={() => onSelect(suggestion)}
              className={`w-full px-3 py-2 text-left hover:bg-accent/10 transition-colors flex items-center justify-between group ${
                index === selectedIndex ? 'bg-accent/10' : ''
              }`}
            >
              <span className={`text-sm truncate ${
                index === selectedIndex ? 'text-accent font-medium' : 'text-text'
              }`}>
                {suggestion}
              </span>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: index === selectedIndex ? 1 : 0, scale: index === selectedIndex ? 1 : 0.5 }}
                className="ml-2"
              >
                <Check className="w-4 h-4 text-accent" />
              </motion.div>
            </button>
          ))}

          {/* Footer */}
          <div className="border-t border-border px-3 py-2 text-xs text-text-secondary">
            <div className="flex items-center justify-between">
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
              <span className="text-accent font-medium">AI Powered ✨</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SmartSuggestionDropdown
