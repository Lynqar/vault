import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Calendar, Shield, AlertTriangle } from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import type { VaultEntry } from '../vault'
import { Button } from '../ui'
import VaultEntryItem from '../components/VaultEntryItem'
import AddEntryModal from '../components/AddEntryModal'
import VaultHeader from '../components/VaultHeader'
import Settings from './Settings'
import { analyzePasswordStrength } from '../lib/passwordGenerator'
const Vault: React.FC = () => {
  const { entries, unlocked, lock } = useVault()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'weak' | 'duplicates'>('all')
  const [showSettings, setShowSettings] = useState(false)

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Vault Locked</h2>
          <p className="text-slate-400 mb-6">Please unlock the vault.</p>
          <Button onClick={() => lock()}>
            Go to Unlock
          </Button>
        </div>
      </div>
    )
  }

  const handleEdit = (entry: VaultEntry) => {
    setEditingEntry(entry)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEntry(null)
  }

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = entries

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.username?.toLowerCase().includes(query) ||
        entry.url?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query)
      )
    }

    // Apply filters
    switch (filterType) {
      case 'recent':
        // Show entries updated in last 7 days
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(entry =>
          new Date(entry.updatedAt || entry.createdAt).getTime() > weekAgo
        )
        break
      case 'weak':
        // Show entries with weak passwords
        filtered = filtered.filter(entry => {
          if (!entry.password) return false
          const strength = analyzePasswordStrength(entry.password)
          return strength.score < 3 // Fair or worse
        })
        break
      case 'duplicates':
        // Show entries with duplicate usernames
        const usernameCount: { [key: string]: number } = {}
        entries.forEach(entry => {
          if (entry.username) {
            usernameCount[entry.username] = (usernameCount[entry.username] || 0) + 1
          }
        })
        filtered = filtered.filter(entry =>
          entry.username && usernameCount[entry.username] > 1
        )
        break
      default:
        // 'all' - no additional filtering
        break
    }

    return filtered
  }, [entries, searchQuery, filterType])

  // Show settings page
  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Lynqar Vault</h1>
            </div>
            <VaultHeader onLock={lock} onSettings={() => setShowSettings(true)} />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Password Vault</h1>
              <p className="text-slate-400">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                {entries.length !== filteredEntries.length && ` of ${entries.length} total`}
                {' stored securely'}
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              Add Entry
            </Button>
          </div>

          {/* Search and Filter Bar */}
          {entries.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search titles, usernames, URLs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType('recent')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterType === 'recent'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  Recent
                </button>
                <button
                  onClick={() => setFilterType('weak')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterType === 'weak'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Weak
                </button>
                <button
                  onClick={() => setFilterType('duplicates')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterType === 'duplicates'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Shield className="w-3 h-3" />
                  Duplicate
                </button>
              </div>
            </div>
          )}
        </div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-indigo-400">lock</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No entries yet</h3>
            <p className="text-slate-400 mb-6">Add your first password entry to get started.</p>
            <Button onClick={() => setShowAddModal(true)}>
              Add Your First Entry
            </Button>
          </motion.div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No matching entries</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Add your first password entry to get started'}
            </p>
            {(searchQuery || filterType !== 'all') && (
              <div className="flex gap-2 justify-center">
                {searchQuery && (
                  <Button onClick={() => setSearchQuery('')} className="bg-slate-600 hover:bg-slate-500">
                    Clear Search
                  </Button>
                )}
                {filterType !== 'all' && (
                  <Button onClick={() => setFilterType('all')} className="bg-slate-600 hover:bg-slate-500">
                    Clear Filter
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredEntries.map((entry, index) => (
              <VaultEntryItem
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-16 border-t border-slate-800/50 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-slate-400 mb-4">
            © 2025 <span className="text-indigo-400 font-semibold">Lynqar</span> – Military-Grade Security
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Zero-knowledge encryption. Your data never leaves your device.
          </p>
          <div className="flex justify-center gap-6">
            <a href="https://github.com/lynqar/vault" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.332-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>

      {showAddModal && (
        <AddEntryModal
          entry={editingEntry}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default Vault
