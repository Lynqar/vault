import React, { useState } from 'react'
import { Lock, Download, Upload, Settings, Menu, X } from 'lucide-react'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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
    window.location.reload()
  }

  const navLinks = (
    <>
      <button
        onClick={handleExport}
        disabled={exporting}
        className="nav-link"
        aria-label="Export vault backup"
      >
        {exporting ? 'Exporting...' : 'Export'}
      </button>
      <button onClick={handleImport} className="nav-link" aria-label="Import vault backup">
        Import
      </button>
      {onSettings && (
        <button onClick={onSettings} className="nav-link" aria-label="Settings">
          Settings
        </button>
      )}
      <button onClick={onLock} className="nav-link" aria-label="Lock vault">
        Lock
      </button>
    </>
  )

  return (
    <>
      <header className="fixed top-0 left-0 w-full bg-black/90 backdrop-blur-lg border-b border-border z-50 py-4">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <a href="https://lynqar.github.io/home/" className="text-xl font-semibold text-text">
            Lynqar
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks}
            <ThemeToggle />
          </nav>
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed top-16 left-0 w-full bg-black/95 backdrop-blur-lg z-40 md:hidden">
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
            {navLinks}
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}

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
