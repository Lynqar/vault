import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Download, Upload, Shield, Settings } from 'lucide-react'
import ImportBackupModal from './ImportBackupModal'
import ThemeToggle from './ThemeToggle'
import { exportVaultBackup } from '../lib/backup'

interface VaultHeaderProps {
  onLock: () => void
  onSettings?: () => void
}

const VaultHeader: React.FC<VaultHeaderProps> = ({ onLock, onSettings }) => {
  const [showImportModal, setShowImportModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  // For export, we need master password - this will be passed from VaultContext
  // For now, we'll prompt the user (in production, should come from context)

  const handleExport = async () => {
    const masterPassword = prompt('Enter your master password to export vault:')
    if (!masterPassword) return

    setExporting(true)
    try {
      await exportVaultBackup(masterPassword)
      alert('Vault backup exported successfully!')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setExporting(false)
    }
  }

  const handleImport = () => {
    setShowImportModal(true)
  }

  const handleImportComplete = () => {
    // Refresh the page to reload entries
    window.location.reload()
  }

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/80 backdrop-blur-lg"
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Lynqar Vault</h1>
                <p className="text-xs text-slate-400">Zero-knowledge encryption</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                title="Export vault backup"
              >
                {exporting ? (
                  <div className="animate-spin w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={handleImport}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Import vault backup"
              >
                <Upload className="w-5 h-5" />
              </button>

              {onSettings && (
                <button
                  onClick={onSettings}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              <ThemeToggle />

              <div className="w-px h-6 bg-white/10" />

              <button
                onClick={onLock}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                title="Lock vault"
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Lock</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {showImportModal && (
        <ImportBackupModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  )
}

export default VaultHeader
