import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import type { VaultEntry } from '../vault'

interface EntryEditorProps {
  entry?: VaultEntry
  isOpen: boolean
  onSave: (entry: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCancel: () => void
}

const EntryEditor: React.FC<EntryEditorProps> = ({ entry, isOpen, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<VaultEntry>>(entry || {})
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title?.trim()) return

    onSave({
      title: formData.title,
      username: formData.username || '',
      password: formData.password || '',
      url: formData.url || '',
      notes: formData.notes || '',
      totpSecret: formData.totpSecret || '',
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-60 p-4">
      <div className="w-full md:w-[720px] bg-surface rounded-xl border border-white/6 shadow-lynqar-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/6">
          <h2 className="text-xl font-semibold text-text">
            {entry ? 'Edit Entry' : 'Add Entry'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-md hover:bg-glass transition-colors"
            aria-label="Close editor"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted mb-1">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              placeholder="Entry title"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-muted mb-1">
              URL
            </label>
            <input
              id="url"
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              placeholder="https://example.com"
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={formData.username || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              placeholder="username@email.com"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pr-12 p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                placeholder="password123"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* TOTP Secret */}
          <div>
            <label htmlFor="totpSecret" className="block text-sm font-medium text-muted mb-1">
              TOTP Secret (optional)
            </label>
            <input
              id="totpSecret"
              type="text"
              value={formData.totpSecret || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, totpSecret: e.target.value.toUpperCase() }))}
              className="w-full p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted font-mono focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
              placeholder="JBSWY3DPEHPK3PXP"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-muted mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors resize-none"
              placeholder="Additional notes..."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-md border border-white/6 text-muted bg-transparent hover:bg-white/3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-accent text-text hover:bg-accent/90 transition-colors font-medium"
            >
              {entry ? 'Save Changes' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EntryEditor
