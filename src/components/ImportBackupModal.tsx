import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { importVaultBackup, validateBackupFile } from '../lib/backup'
import { Button } from '../ui'

interface ImportBackupModalProps {
  onClose: () => void
  onImportComplete: () => void
}

type ImportMode = 'choose' | 'confirm' | 'progress' | 'success' | 'error'

const ImportBackupModal: React.FC<ImportBackupModalProps> = ({ onClose, onImportComplete }) => {
  const [mode, setMode] = useState<ImportMode>('choose')
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge')
  const [masterPassword, setMasterPassword] = useState('')
  const [fileContent, setFileContent] = useState('')
  const [error, setError] = useState('')
  const [importResult, setImportResult] = useState<{ totalEntries: number; imported: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (validateBackupFile(content.trim())) {
        setFileContent(content.trim())
        setMode('confirm')
        setError('')
      } else {
        setError('Invalid backup file format')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!masterPassword) {
      setError('Master password is required')
      return
    }

    setLoading(true)
    setMode('progress')

    try {
      const result = await importVaultBackup(fileContent, masterPassword, importMode)
      setImportResult(result)
      setMode('success')
      onImportComplete()
    } catch (err) {
      console.error('Import failed:', err)
      setError(err instanceof Error ? err.message : 'Import failed')
      setMode('error')
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setMode('choose')
    setImportMode('merge')
    setMasterPassword('')
    setFileContent('')
    setError('')
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">
                {mode === 'choose' && 'Import Vault Backup'}
                {mode === 'confirm' && 'Confirm Import'}
                {mode === 'progress' && 'Importing...'}
                {mode === 'success' && 'Import Complete'}
                {mode === 'error' && 'Import Failed'}
              </h2>
            </div>
            <button
              onClick={mode !== 'progress' ? onClose : undefined}
              disabled={mode === 'progress'}
              className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'choose' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-slate-400 text-sm mb-4">
                    Select a vault backup file (.vaultbackup) to import
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".vaultbackup"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose Backup File
                </Button>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>• Backup file must be created by Lynqar Vault</p>
                  <p>• File will be decrypted using your master password</p>
                  <p>• Choose merge or overwrite mode in next step</p>
                </div>
              </div>
            )}

            {mode === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 text-sm">Valid backup file selected</span>
                </div>

                {/* Import Mode */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Import Mode
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="merge"
                        checked={importMode === 'merge'}
                        onChange={(e) => setImportMode(e.target.value as 'merge')}
                        className="text-indigo-600 bg-slate-700 border-slate-600"
                      />
                      <span className="text-sm text-slate-300">
                        <strong>Merge:</strong> Add entries that don't already exist
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="importMode"
                        value="overwrite"
                        checked={importMode === 'overwrite'}
                        onChange={(e) => setImportMode(e.target.value as 'overwrite')}
                        className="text-indigo-600 bg-slate-700 border-slate-600"
                      />
                      <span className="text-sm text-slate-300">
                        <strong>Overwrite:</strong> Replace entire vault (destructive!)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Master Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter master password to decrypt"
                    required
                  />
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  {importMode === 'overwrite' && (
                    <div className="flex items-center space-x-2 p-3 bg-red-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">Warning: This will replace your current vault!</span>
                    </div>
                  )}
                  <p>• Your current vault will remain unchanged until import completes</p>
                  <p>• Wrong password will fail the import</p>
                </div>
              </div>
            )}

            {mode === 'progress' && (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-white mb-2">Importing Vault</h3>
                <p className="text-slate-400">Decrypting and importing entries...</p>
              </div>
            )}

            {mode === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Import Complete</h3>
                <p className="text-slate-400 mb-4">
                  Successfully imported {importResult?.imported} of {importResult?.totalEntries} entries
                </p>
                <p className="text-sm text-slate-500">
                  Refresh the page to see changes
                </p>
              </div>
            )}

            {mode === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Import Failed</h3>
                <p className="text-slate-400 mb-4">{error}</p>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>• Check that the master password is correct</p>
                  <p>• Ensure the backup file is not corrupted</p>
                  <p>• Try selecting the file again</p>
                </div>
              </div>
            )}

            {error && mode !== 'error' && (
              <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-slate-700">
            {mode === 'choose' && (
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-600 hover:bg-slate-500"
              >
                Cancel
              </Button>
            )}

            {mode === 'confirm' && (
              <>
                <Button
                  onClick={resetModal}
                  className="flex-1 bg-slate-600 hover:bg-slate-500"
                >
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || !masterPassword}
                  className="flex-1"
                >
                  {importMode === 'overwrite' ? 'Replace Vault' : 'Merge Entries'}
                </Button>
              </>
            )}

            {(mode === 'success' || mode === 'error') && (
              <Button
                onClick={onClose}
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ImportBackupModal
