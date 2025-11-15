import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Copy, Edit, Trash2, Globe, User, Shield } from 'lucide-react'
import type { VaultEntry } from '../vault'
import { useVault } from '../contexts/VaultContext'
import { copyPassword, copyUsername, copyTOTPCode, getClipboardAutoClearEnabled, secureClipboard } from '../lib/clipboard'
import { getDomain, useFavicon } from '../lib/favicon'
import TOTPCodeDisplay from './TOTPCodeDisplay'
import ClipboardWarningModal from './ClipboardWarningModal'
import { useInfoToast } from '../contexts/ToastContext'

interface VaultEntryItemProps {
  entry: VaultEntry
  onEdit: (entry: VaultEntry) => void
  index: number
}

const VaultEntryItem: React.FC<VaultEntryItemProps> = ({ entry, onEdit, index }) => {
  const { deleteEntry } = useVault()
  const showClipboardClearedToast = useInfoToast()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | undefined>(undefined)
  const [clipboardWarning, setClipboardWarning] = useState<{
    show: boolean
    type: 'password' | 'totp' | 'username'
    pendingCopy?: { text: string; field: string }
  }>({ show: false, type: 'password' })

  // Get favicon for the domain
  const domain = entry.url ? getDomain(entry.url) : ''
  const { favicon, loading } = useFavicon(domain)

  // Register callback for clipboard clear events
  useEffect(() => {
    const unregister = secureClipboard.onClipboardCleared(() => {
      showClipboardClearedToast('Clipboard automatically cleared for security', 4000)
    })

    return unregister
  }, [showClipboardClearedToast])

  const copyToClipboard = async (text: string | undefined, field: string) => {
    if (!text) return
    try {
      // Use appropriate copy function based on field type
      switch (field) {
        case 'password':
          await copyPassword(text)
          break
        case 'username':
          await copyUsername(text)
          break
        case 'totp':
          await copyTOTPCode(text)
          break
        default:
          await navigator.clipboard.writeText(text)
      }

      setCopiedField(field)
      // Show copied feedback longer if auto-clear is enabled
      const feedbackDuration = getClipboardAutoClearEnabled() ? 4000 : 2000
      setTimeout(() => setCopiedField(undefined), feedbackDuration)

    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      await deleteEntry(entry.id)
    }
  }



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.32, ease: 'easeOut' }}
      className="flex justify-between items-start p-4 rounded-lg bg-surface border border-border hover:border-accent/50 transition-colors duration-200"
    >
      <div className="flex-1 min-w-0">
        {/* Title and URL */}
        <div className="flex items-center space-x-3 mb-3">
          {entry.url ? (
            loading ? (
              <div className="w-6 h-6 bg-glass rounded animate-pulse" />
            ) : favicon && favicon.loaded ? (
              <img
                src={favicon.url}
                alt=""
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="w-6 h-6 bg-glass rounded flex items-center justify-center">
                <Globe className="w-4 h-4 text-muted" />
              </div>
            )
          ) : (
            <div className="w-6 h-6 bg-glass rounded flex items-center justify-center">
              <Globe className="w-4 h-4 text-muted" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-text truncate">{entry.title}</h3>
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:text-accent transition-colors truncate block"
              >
                {entry.url}
              </a>
            )}
          </div>
        </div>

        {/* Smart Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {entry.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs border border-purple-500/30"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Username */}
        {entry.username && (
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-muted" />
            <span className="text-muted">{entry.username}</span>
            <button
              onClick={() => copyToClipboard(entry.username!, 'username')}
              className="p-1 text-muted hover:text-text transition-colors"
              title="Copy username"
              aria-label="Copy username"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copiedField === 'username' && (
              <span className="text-xs text-success">Copied!</span>
            )}
          </div>
        )}

        {/* Password */}
        {entry.password && (
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-muted font-mono">
              {showPassword ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-muted hover:text-text transition-colors"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={() => copyToClipboard(entry.password, 'password')}
              className="p-1 text-muted hover:text-text transition-colors"
              title="Copy password"
              aria-label="Copy password"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copiedField === 'password' && (
              <span className="text-xs text-success">Copied!</span>
            )}
          </div>
        )}

        {/* TOTP Code */}
        {entry.totpSecret && (
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-primary" />
            <TOTPCodeDisplay
              secret={entry.totpSecret}
              onCopy={() => copyToClipboard('TOTP code', 'totp')}
            />
            {copiedField === 'totp' && (
              <span className="text-xs text-success">Copied!</span>
            )}
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div className="text-sm text-muted mt-2 line-clamp-2">
            {entry.notes}
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-muted mt-3">
          Created {new Date(entry.createdAt).toLocaleDateString()}
          {entry.updatedAt && ` • Updated ${new Date(entry.updatedAt).toLocaleDateString()}`}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1 ml-4">
        <button
          onClick={() => onEdit(entry)}
          className="p-2 text-muted hover:text-text rounded-sm hover:bg-glass transition-all duration-200"
          title="Edit entry"
          aria-label="Edit entry"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleDelete()}
          className="p-2 text-muted hover:text-red-400 rounded-sm hover:bg-red-500/10 transition-all duration-200"
          title="Delete entry"
          aria-label="Delete entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Clipboard Warning Modal */}
      <ClipboardWarningModal
        isVisible={clipboardWarning.show}
        type={clipboardWarning.type}
        onClose={() => setClipboardWarning({ show: false, type: 'password' })}
        onConfirm={async () => {
          setClipboardWarning({ show: false, type: 'password' })
          if (clipboardWarning.pendingCopy) {
            await copyToClipboard(
              clipboardWarning.pendingCopy.text,
              clipboardWarning.pendingCopy.field
            )
          }
        }}
        onDontShowAgain={() => {
          localStorage.setItem('clipboard_warning_dismissed', 'true')
          setClipboardWarning({ show: false, type: 'password' })
        }}
      />
    </motion.div>
  )
}

export default VaultEntryItem
