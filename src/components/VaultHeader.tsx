import React from 'react'
import { motion } from 'framer-motion'
import { Lock, Download, Upload, Shield } from 'lucide-react'

interface VaultHeaderProps {
  onLock: () => void
}

const VaultHeader: React.FC<VaultHeaderProps> = ({ onLock }) => {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export functionality coming soon')
  }

  const handleImport = () => {
    // TODO: Implement import functionality
    console.log('Import functionality coming soon')
  }

  return (
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
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Export vault backup"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={handleImport}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Import vault backup"
            >
              <Upload className="w-5 h-5" />
            </button>

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
  )
}

export default VaultHeader
