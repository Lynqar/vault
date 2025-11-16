import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Calendar, Shield, AlertTriangle, Download } from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import type { VaultEntry } from '../vault'
import { Button } from '../ui'
import VaultEntryItem from '../components/VaultEntryItem'
import AddEntryModal from '../components/AddEntryModal'
import TOTPExportModal from '../components/TOTPExportModal'
import PasswordAuditModal from '../components/PasswordAuditModal'
import SecurityScoreWidget from '../components/SecurityScoreWidget'
import MobileDock, { type DockTab } from '../components/MobileDock'
import VaultHeader from '../components/VaultHeader'
import Settings from './Settings'
import { analyzePasswordStrength } from '../lib/passwordGenerator'
import { usePWAInstall } from '../lib/usePWAInstall'
import { useInfoToast } from '../contexts/ToastContext'
const Vault: React.FC = () => {
  const { entries, unlocked, lock } = useVault()
  const activeTab: DockTab = 'vault'
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null)
  const [showTOTPExportModal, setShowTOTPExportModal] = useState(false)
  const [showPasswordAudit, setShowPasswordAudit] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'recent' | 'weak' | 'duplicates'>('all')
  const [showSettings, setShowSettings] = useState(false)
  const [engagementCount, setEngagementCount] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const { isInstallable, promptToInstall } = usePWAInstall()
  const showToast = useInfoToast()

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <div className="text-center">
          <h2 className="text-lg font-bold text-text mb-4">Vault Locked</h2>
          <p className="text-muted mb-6">Please unlock the vault.</p>
          <button onClick={() => lock()} className="px-4 py-2 rounded-full bg-accent text-text hover:bg-accent/90 font-semibold shadow-sm transition-colors">
            Go to Unlock
          </button>
        </div>
      </div>
    )
  }

  // Track user engagement for PWA prompt
  useEffect(() => {
    const currentCount = parseInt(localStorage.getItem('vault_engagement_count') || '0', 10)
    setEngagementCount(currentCount)

    // Increment engagement count
    const newCount = currentCount + 1
    localStorage.setItem('vault_engagement_count', newCount.toString())

    // Check if we should show PWA install prompt (after 3 engagements)
    if (newCount >= 3 && isInstallable && !localStorage.getItem('pwa_prompt_dismissed')) {
      setTimeout(() => {
        showPWAPrompt()
      }, 2000) // Show after 2 seconds
    }
  }, [])

  const showPWAPrompt = () => {
    // In a real implementation, this would show a custom modal
    // For now, we'll use a browser alert
    if (confirm('Install Lynqar for offline access and faster loading. Add to your home screen?')) {
      promptToInstall?.().then(() => {
        showToast('Thanks for installing!', 3000)
      }).catch(() => {
        // User dismissed or error
      })
    } else {
      localStorage.setItem('pwa_prompt_dismissed', 'true')
    }
  }

  const handleEdit = (entry: VaultEntry) => {
    setEditingEntry(entry)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEntry(null)
  }

  const handleTabChange = (tab: DockTab) => {
    if (tab === 'new') {
      setShowAddModal(true)
    } else if (tab === 'menu') {
      setShowSettings(true)
    } else if (tab === 'search') {
      // Focus search input when search tab is activated
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
  }

  const handleSearchFocus = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      // Smooth scroll to search input on mobile
      if (window.innerWidth < 768) {
        searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
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

  // Show settings page (desktop override)
  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  // Determine if we're on mobile (show dock) or desktop (show header)
  const isMobile = window.innerWidth < 768

  return (
    <div className="min-h-screen bg-bg">
      {/* Header - responsive with mobile menu */}
      <VaultHeader onLock={lock} onSettings={() => setShowSettings(true)} />

      <main className={`container px-6 ${!isMobile ? 'pt-28 pb-8' : 'pt-6 pb-24'}`}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={`${isMobile ? 'text-3xl' : 'text-[clamp(1.9rem,4vw,3.6rem)]'} font-extrabold leading-none bg-clip-text text-transparent bg-gradient-to-r from-accentStart to-accentEnd`}>
                Password Vault
              </h1>
              <p className="text-muted mt-2">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'}
                {entries.length !== filteredEntries.length && ` of ${entries.length} total`}
                {' stored securely'}
              </p>
            </div>
            {!isMobile && (
              <div className="flex items-center gap-3">
                {entries.length > 0 && (
                  <button
                    onClick={() => setShowPasswordAudit(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent text-accent hover:bg-accent/10 font-medium transition-colors"
                    title="Security audit"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Security Audit</span>
                  </button>
                )}
                {entries.some(entry => entry.totpSecret) && (
                  <button
                    onClick={() => setShowTOTPExportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent text-accent hover:bg-accent/10 font-medium transition-colors"
                    title="Export TOTP secrets"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Export TOTP</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-accent text-text hover:bg-accent/90 font-semibold shadow-sm transition-colors"
                >
                  Add Entry
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          {entries.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search vault..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-md bg-black/20 border border-white/6 text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                  aria-label="Search vault"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content based on active tab/navigation */}
        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-glass rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-primary text-4xl">🔐</span>
            </div>
            <h3 className="text-base font-semibold text-text mb-2">No entries yet</h3>
            <p className="text-muted mb-6">Add your first password entry to get started.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-accent text-text hover:bg-accent/90 font-semibold shadow-sm transition-colors"
            >
              Add Your First Entry
            </button>
          </motion.div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-glass rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-text" />
            </div>
            <h3 className="text-base font-semibold text-text mb-2">No matching entries</h3>
            <p className="text-muted mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Add your first password entry to get started'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-3 px-4 py-2 rounded-md border border-white/6 text-muted bg-transparent hover:bg-white/3 transition-colors"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Security Score Widget - Prominently displayed */}
            <SecurityScoreWidget
              onViewFullScore={() => setShowPasswordAudit(true)}
            />

            {/* Password Entries */}
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
          </div>
        )}
      </main>

      {/* Footer - only on desktop */}
      {!isMobile && (
        <footer className="bg-bg border-t border-border py-12 text-center text-muted text-sm">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
              <div className="footer-section">
                <h4 className="text-text font-semibold mb-4">Product</h4>
                <ul>
                  <li><a href="#features" className="footer-link">Features</a></li>
                  <li><a href="#download" className="footer-link">Download</a></li>
                  <li><a href="#security" className="footer-link">Security</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4 className="text-text font-semibold mb-4">Company</h4>
                <ul>
                  <li><a href="#about" className="footer-link">About Us</a></li>
                  <li><a href="#blog" className="footer-link">Blog</a></li>
                  <li><a href="#careers" className="footer-link">Careers</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4 className="text-text font-semibold mb-4">Support</h4>
                <ul>
                  <li><a href="mailto:support@lynqar.app" className="footer-link">Contact</a></li>
                  <li><a href="#docs" className="footer-link">Documentation</a></li>
                  <li><a href="#faq" className="footer-link">FAQ</a></li>
                </ul>
              </div>
              <div className="footer-section">
                <h4 className="text-text font-semibold mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  <a href="#" aria-label="GitHub" className="text-2xl">🐙</a>
                  <a href="#" aria-label="Twitter" className="text-2xl">🐦</a>
                  <a href="#" aria-label="LinkedIn" className="text-2xl">💼</a>
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-8">
              <p>&copy; 2025 <strong>Lynqar</strong>. Made in India with ❤️. All rights reserved.</p>
              <div className="flex justify-center gap-4 mt-4">
                <span className="trust-badge">Open Source</span>
                <span className="trust-badge">AES-256 Encrypted</span>
                <span className="trust-badge">Zero Cloud</span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Mobile Bottom Dock */}
      {isMobile && (
        <MobileDock
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearchFocus={handleSearchFocus}
          isSearchActive={!!searchQuery}
        />
      )}

      {/* Modals */}
      {showAddModal && (
        <AddEntryModal
          entry={editingEntry}
          onClose={handleCloseModal}
        />
      )}

      {showTOTPExportModal && (
        <TOTPExportModal
          isVisible={showTOTPExportModal}
          entries={entries}
          onClose={() => setShowTOTPExportModal(false)}
        />
      )}

      <PasswordAuditModal
        isOpen={showPasswordAudit}
        onClose={() => setShowPasswordAudit(false)}
      />
    </div>
  )
}

export default Vault
