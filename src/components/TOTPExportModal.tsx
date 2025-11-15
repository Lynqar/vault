import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, QrCode, Copy, Shield, AlertTriangle } from 'lucide-react'
import type { VaultEntry } from '../vault'
import { createTOTPUrl } from '../lib/totp'
import { useInfoToast } from '../contexts/ToastContext'

interface TOTPExportModalProps {
  isVisible: boolean
  entries: VaultEntry[]
  onClose: () => void
}

interface TOTPExportData {
  title: string
  secret: string
  url: string
  issuer?: string
  backupCodes?: string[]
}

const TOTPExportModal: React.FC<TOTPExportModalProps> = ({ isVisible, entries, onClose }) => {
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())
  const [exportFormat, setExportFormat] = useState<'url' | 'secret' | 'json'>('url')
  const [showQR, setShowQR] = useState<string | null>(null)
  const showToast = useInfoToast()

  // Filter entries that have TOTP
  const totpEntries = entries.filter(entry => entry.totpSecret)

  useEffect(() => {
    if (isVisible) {
      // Auto-select all entries when modal opens
      setSelectedEntries(new Set(totpEntries.map(entry => entry.id)))
    }
  }, [isVisible, totpEntries])

  const handleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries)
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId)
    } else {
      newSelected.add(entryId)
    }
    setSelectedEntries(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedEntries(new Set(totpEntries.map(entry => entry.id)))
  }

  const handleClearSelection = () => {
    setSelectedEntries(new Set())
  }

  const getExportData = (): TOTPExportData[] => {
    return Array.from(selectedEntries)
      .map(entryId => entries.find(entry => entry.id === entryId))
      .filter(Boolean)
      .map(entry => ({
        title: entry!.title,
        secret: entry!.totpSecret!,
        url: createTOTPUrl({ secret: entry!.totpSecret!, label: entry!.title }),
        issuer: entry!.url ? new URL(entry!.url).hostname : undefined,
        backupCodes: entry!.backupCodes
      }))
  }

  const exportAsURLs = () => {
    const data = getExportData()
    const urls = data.map(item => item.url).join('\n')
    return urls
  }

  const exportAsSecrets = () => {
    const data = getExportData()
    const secrets = data.map(item => `${item.title}: ${item.secret}`).join('\n')
    return secrets
  }

  const exportAsJSON = () => {
    const data = getExportData()
    return JSON.stringify(data, null, 2)
  }

  const handleCopyExport = async () => {
    try {
      let content = ''
      switch (exportFormat) {
        case 'url':
          content = exportAsURLs()
          break
        case 'secret':
          content = exportAsSecrets()
          break
        case 'json':
          content = exportAsJSON()
          break
      }

      await navigator.clipboard.writeText(content)
      showToast(`${selectedEntries.size} TOTP ${selectedEntries.size === 1 ? 'secret' : 'secrets'} copied to clipboard`, 3000)
    } catch (error) {
      console.error('Failed to copy export data:', error)
    }
  }

  const downloadExport = () => {
    try {
      let content = ''
      let filename = 'totp-export'
      let mimeType = 'text/plain'

      switch (exportFormat) {
        case 'url':
          content = exportAsURLs()
          filename += '.txt'
          break
        case 'secret':
          content = exportAsSecrets()
          filename += '.txt'
          break
        case 'json':
          content = exportAsJSON()
          filename += '.json'
          mimeType = 'application/json'
          break
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast(`TOTP backup downloaded as ${filename}`, 3000)
    } catch (error) {
      console.error('Failed to download export:', error)
    }
  }

  const generateQRCode = (entryId: string) => {
    // Find the entry and generate QR for its TOTP URL
    const entry = entries.find(e => e.id === entryId)
    if (entry?.totpSecret) {
      setShowQR(entryId)
    }
  }

  if (!isVisible) return null

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
          className="w-full max-w-2xl max-h-[90vh] bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="modal-header flex items-center space-x-2">
              <Shield className="w-5 h-5 text-accent" />
              <span>Export TOTP Secrets</span>
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {/* Export Format Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted mb-3">
                Export Format
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 'url', label: 'TOTP URLs', description: 'Full otpauth:// URLs' },
                  { value: 'secret', label: 'Secrets Only', description: 'Base32 secrets' },
                  { value: 'json', label: 'JSON Format', description: 'Structured data' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => setExportFormat(format.value as typeof exportFormat)}
                    className={`flex-1 p-3 rounded-lg border transition-colors text-left ${
                      exportFormat === format.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-glass/20 hover:bg-glass/40'
                    }`}
                  >
                    <div className="font-medium text-sm">{format.label}</div>
                    <div className="text-xs text-muted mt-1">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-muted">
                  Select Entries to Export ({selectedEntries.size} of {totpEntries.length} selected)
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    Select All
                  </button>
                  <span className="text-muted">|</span>
                  <button
                    onClick={handleClearSelection}
                    className="text-xs text-muted hover:text-text"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {totpEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={`flex items-center space-x-3 p-3 rounded border transition-colors cursor-pointer ${
                      selectedEntries.has(entry.id)
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-glass/20 hover:bg-glass/40'
                    }`}
                    onClick={() => handleSelectEntry(entry.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.id)}
                      onChange={() => handleSelectEntry(entry.id)}
                      className="h-4 w-4 text-accent"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entry.title}</div>
                      <div className="text-xs text-muted">
                        {entry.url ? new URL(entry.url).hostname : 'No URL'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        generateQRCode(entry.id)
                      }}
                      className="p-1 text-muted hover:text-text"
                      title="Show QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedEntries.size === 0 && (
              <div className="flex items-center space-x-3 p-4 bg-warning/10 border border-warning/20 rounded">
                <AlertTriangle className="w-5 h-5 text-warning" />
                <div className="text-sm text-muted">
                  No entries selected. Select at least one entry to export.
                </div>
              </div>
            )}

            {/* Export Preview */}
            {selectedEntries.size > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-muted mb-3">
                  Preview ({exportFormat.toUpperCase()})
                </label>
                <div className="bg-glass/20 border border-border rounded p-3 max-h-32 overflow-y-auto">
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {exportFormat === 'url' && exportAsURLs().substring(0, 500)}
                    {exportFormat === 'secret' && exportAsSecrets().substring(0, 500)}
                    {exportFormat === 'json' && exportAsJSON().substring(0, 500)}
                    {(exportFormat === 'url' || exportFormat === 'secret' || exportFormat === 'json') &&
                      (exportAsURLs().length > 500 || exportAsSecrets().length > 500 || exportAsJSON().length > 500) &&
                      '\n... (truncated)'
                    }
                  </pre>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-border">
              <button
                onClick={handleCopyExport}
                disabled={selectedEntries.size === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-accent/90 text-text rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </button>
              <button
                onClick={downloadExport}
                disabled={selectedEntries.size === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default TOTPExportModal
