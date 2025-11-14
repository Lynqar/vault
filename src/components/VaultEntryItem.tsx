import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Copy, Edit, Trash2, Globe, User, Shield } from 'lucide-react'
import type { VaultEntry } from '../vault'
import { useVault } from '../contexts/VaultContext'
import { MemorySecurity } from '../lib/security'
import { getDomain, useFavicon } from '../lib/favicon'
import TOTPCodeDisplay from './TOTPCodeDisplay'

interface VaultEntryItemProps {
  entry: VaultEntry
  onEdit: (entry: VaultEntry) => void
  index: number
}

const VaultEntryItem: React.FC<VaultEntryItemProps> = ({ entry, onEdit, index }) => {
  const { deleteEntry } = useVault()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | undefined>(undefined)

  // Get favicon for the domain
  const domain = entry.url ? getDomain(entry.url) : ''
  const { favicon, loading } = useFavicon(domain)

  const copyToClipboard = async (text: string | undefined, field: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(undefined), 2000)

      // Clear clipboard after 30 seconds for security (but only for sensitive data)
      if (field === 'password' || field === 'totp') {
        MemorySecurity.clearClipboardAfter(30000)
      }
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
      transition={{ delay: index * 0.1 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title and URL */}
          <div className="flex items-center space-x-3 mb-3">
            {entry.url ? (
              loading ? (
                <div className="w-6 h-6 bg-slate-600 rounded animate-pulse" />
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
                <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                  <Globe className="w-4 h-4 text-slate-400" />
                </div>
              )
            ) : (
              <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                <Globe className="w-4 h-4 text-slate-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-white truncate">{entry.title}</h3>
              {entry.url && (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-400 hover:text-indigo-300 truncate block"
                >
                  {entry.url}
                </a>
              )}
            </div>
          </div>

          {/* Username */}
          {entry.username && (
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">{entry.username}</span>
              <button
                onClick={() => copyToClipboard(entry.username!, 'username')}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Copy username"
              >
                <Copy className="w-4 h-4" />
              </button>
              {copiedField === 'username' && (
                <span className="text-xs text-green-400">Copied!</span>
              )}
            </div>
          )}

          {/* Password */}
          {entry.password && (
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-slate-400 font-mono">
                {showPassword ? entry.password : '•'.repeat(Math.min(entry.password.length, 16))}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(entry.password, 'password')}
                className="p-1 text-slate-400 hover:text-white transition-colors"
                title="Copy password"
              >
                <Copy className="w-4 h-4" />
              </button>
              {copiedField === 'password' && (
                <span className="text-xs text-green-400">Copied!</span>
              )}
            </div>
          )}

          {/* TOTP Code */}
          {entry.totpSecret && (
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <TOTPCodeDisplay
                secret={entry.totpSecret}
                onCopy={() => copyToClipboard('TOTP code', 'totp')}
              />
              {copiedField === 'totp' && (
                <span className="text-xs text-green-400">Copied!</span>
              )}
            </div>
          )}

          {/* Notes */}
          {entry.notes && (
            <div className="text-sm text-slate-400 mt-2 line-clamp-2">
              {entry.notes}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-slate-500 mt-3">
            Created {new Date(entry.createdAt).toLocaleDateString()}
            {entry.updatedAt && ` • Updated ${new Date(entry.updatedAt).toLocaleDateString()}`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1 ml-4">
          <button
            onClick={() => onEdit(entry)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Edit entry"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete()}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default VaultEntryItem
