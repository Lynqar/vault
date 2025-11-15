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
          className="w-full max-w-md bg-surface border border-border rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-accent" />
            <h2 className="modal-header">
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
              className="p-2 text-muted hover:text-text transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'choose' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-accent" />
                  </div>
                  <p className="text-muted text-sm mb-4">
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

                <div className="text-xs text-muted space-y-1">
                  <p>• Backup file must be created by Lynqar Vault</p>
                  <p>• File will be decrypted using your master password</p>
                  <p>• Choose merge or overwrite mode in next step</p>
                </div>
              </div>
            )}

            {mode === 'confirm' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-accent" />
                  <span className="text-accent text-sm">Valid backup file selected</span>
                </div>

                {/* Import Mode */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
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
                        className="text-accent bg-surface border-border"
                      />
                      <span className="text-muted text-sm">
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
                        className="text-accent bg-surface border-border"
                      />
                      <span className="text-muted text-sm">
                        <strong>Overwrite:</strong> Replace entire vault (destructive!)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Master Password */}
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Master Password
                  </label>
                  <input
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter master password to decrypt"
                    required
                  />
                </div>

                <div className="text-xs text-muted space-y-1">
                  {importMode === 'overwrite' && (
                    <div className="flex items-center space-x-2 p-3 bg-error/10 border border-error/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-error" />
                      <span className="text-error text-sm">Warning: This will replace your current vault!</span>
                    </div>
                  )}
                  <p>• Your current vault will remain unchanged until import completes</p>
                  <p>• Wrong password will fail the import</p>
                </div>
              </div>
            )}

            {mode === 'progress' && (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-text mb-2">Importing Vault</h3>
                <p className="text-muted">Decrypting and importing entries...</p>
              </div>
            )}

            {mode === 'success' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">Import Complete</h3>
                <p className="text-muted mb-4">
                  Successfully imported {importResult?.imported} of {importResult?.totalEntries} entries
                </p>
                <p className="text-sm text-muted">
                  Refresh the page to see changes
                </p>
              </div>
            )}

            {mode === 'error' && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-error/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-error" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-2">Import Failed</h3>
                <p className="text-muted mb-4">{error}</p>
                <div className="text-xs text-muted space-y-1">
                  <p>• Check that the master password is correct</p>
                  <p>• Ensure the backup file is not corrupted</p>
                  <p>• Try selecting the file again</p>
                </div>
              </div>
            )}

            {error && mode !== 'error' && (
              <div className="bg-error/10 border border-error/20 rounded p-3">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex space-x-3 p-6 border-t border-border">
            {mode === 'choose' && (
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-muted/20 hover:bg-muted/30"
              >
                Cancel
              </Button>
            )}

            {mode === 'confirm' && (
              <>
                <Button
                  onClick={resetModal}
                  className="flex-1 bg-muted/20 hover:bg-muted/30"
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
