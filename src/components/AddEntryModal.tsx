import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RefreshCw, Eye, EyeOff, Copy, QrCode, Link, Shield, Key } from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import type { VaultEntry } from '../vault'
import { Button } from '../ui'
import { generatePassword, DEFAULT_CONFIG, type PasswordConfig } from '../lib/passwordGenerator'
import { Validators, MemorySecurity } from '../lib/security'
import { smartSuggestions } from '../lib/smartSuggestions'
import {
  parseTOTPUrl,
  generateTOTPSecret,
  generateTOTPToken,
  generateBackupCodes,
  isValidTOTPSecret
} from '../lib/totp'
import SmartSuggestionDropdown from './SmartSuggestionDropdown'
import QRScannerModal from './QRScannerModal'

interface AddEntryModalProps {
  entry?: VaultEntry | null
  onClose: () => void
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ entry, onClose }) => {
  const { addEntry, updateEntry, entries } = useVault()
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    totpSecret: '',
    backupCodes: [] as string[]
  })
  const [showPassword, setShowPassword] = useState(false)
  const [passwordConfig, setPasswordConfig] = useState<PasswordConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enableTOTP, setEnableTOTP] = useState(false)
  const [totpUrl, setTotpUrl] = useState('')

  // Smart suggestions state
  const [showUsernameSuggestions, setShowUsernameSuggestions] = useState(false)
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([])

  // QR scanner state
  const [showQRScanner, setShowQRScanner] = useState(false)

  const isEditing = !!entry

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title || '',
        username: entry.username || '',
        password: entry.password || '',
        url: entry.url || '',
        notes: entry.notes || '',
        totpSecret: entry.totpSecret || '',
        backupCodes: entry.backupCodes || []
      })
      // Enable TOTP if the entry already has a TOTP secret
      setEnableTOTP(!!entry.totpSecret)
    }
  }, [entry])

  // Smart suggestions for username field
  const updateUsernameSuggestions = (input: string) => {
    if (!input.trim()) {
      setShowUsernameSuggestions(false)
      setUsernameSuggestions([])
      return
    }

    // Extract domain from URL to provide targeted suggestions
    let domain = ''
    if (formData.url) {
      try {
        domain = new URL(formData.url.startsWith('http') ? formData.url : `https://${formData.url}`).hostname
      } catch {}
    }

    // Get smart suggestions based on existing entries and domain
    const suggestions = smartSuggestions.getSuggestions(
      entries,
      domain || 'general', // fallback to 'general' if no domain
      input.includes('@') ? 'email' : 'username'
    )

    setUsernameSuggestions(suggestions)
    setShowUsernameSuggestions(suggestions.length > 0)
  }

  // Update smart URL and password recommendations when URL changes
  const handleUrlChange = (value: string) => {
    handleInputChange('url', value)

    // Update password config based on domain security requirements
    if (value) {
      try {
        const domain = new URL(value.startsWith('http') ? value : `https://${value}`).hostname
        const smartConfig = smartSuggestions.getRecommendedPasswordConfig(entries, domain)

        // Update password generator config to match domain requirements
        setPasswordConfig({
          length: smartConfig.length,
          includeUppercase: smartConfig.includeUppercase,
          includeLowercase: smartConfig.includeLowercase,
          includeNumbers: smartConfig.includeNumbers,
          includeSymbols: smartConfig.includeSymbols,
          excludeAmbiguous: true // Keep it secure
        })
      } catch {}
    }
  }

  // Password functions
  const generateRandomPassword = () => {
    const password = generatePassword(passwordConfig)
    setFormData(prev => ({ ...prev, password }))
  }

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(formData.password)
      // Clear clipboard after 30 seconds for security
      MemorySecurity.clearClipboardAfter(30000)
    } catch (err) {
      console.error('Failed to copy password:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Sanitize inputs
    const sanitizedData = {
      ...formData,
      title: Validators.sanitizeString(formData.title),
      username: Validators.sanitizeString(formData.username),
      password: formData.password, // Don't sanitize passwords
      url: Validators.sanitizeString(formData.url),
      notes: Validators.sanitizeString(formData.notes),
      totpSecret: Validators.sanitizeString(formData.totpSecret),
      backupCodes: formData.backupCodes
    }

    // Validate the sanitized data
    const validation = Validators.validateVaultEntry(sanitizedData)
    if (!validation.isValid) {
      setError(validation.errors.join('. '))
      return
    }

    setLoading(true)

    try {
      if (isEditing && entry) {
        await updateEntry(entry.id, sanitizedData)
      } else {
        await addEntry(sanitizedData)
      }
      onClose()
    } catch (err) {
      console.error('Error saving entry:', err)
      setError('Failed to save entry. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Handle QR code scan for TOTP setup
  const handleQRScanned = (qrData: string) => {
<<<<<<< HEAD
    console.log('QR scanned:', qrData)

    // Try to parse as TOTP URL
    const parsed = parseTOTPUrl(qrData)
    if (parsed) {
      console.log('TOTP URL parsed:', parsed)
=======
    // Try to parse as TOTP URL
    const parsed = parseTOTPUrl(qrData)
    if (parsed) {
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)
      setFormData(prev => ({
        ...prev,
        totpSecret: parsed.secret,
        title: parsed.label || prev.title,
        username: parsed.label && parsed.label.includes(':')
          ? parsed.label.split(':')[1] || prev.username
          : prev.username
      }))
      setEnableTOTP(true) // Enable TOTP section
    } else {
      // If not a valid TOTP URL, don't fill anything
<<<<<<< HEAD
      console.warn('Invalid TOTP URL scanned:', qrData)
=======
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)
      setError('Invalid QR code. Please scan a valid TOTP QR code.')
    }

    setShowQRScanner(false)
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
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="modal-header">
              {isEditing ? 'Edit Entry' : 'Add New Entry'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-muted hover:text-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="form-input"
                placeholder="e.g., Gmail, GitHub, etc."
                required
              />
            </div>

            {/* Username */}
            <div className="relative">
              <label className="block text-sm font-medium text-muted mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  handleInputChange('username', e.target.value)
                  updateUsernameSuggestions(e.target.value)
                }}
                onFocus={() => {
                  if (formData.username) {
                    updateUsernameSuggestions(formData.username)
                  }
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow click selection
                  setTimeout(() => setShowUsernameSuggestions(false), 200)
                }}
                className="form-input"
                placeholder="your.email@example.com"
              />

              <SmartSuggestionDropdown
                suggestions={usernameSuggestions}
                onSelect={(suggestion) => {
                  handleInputChange('username', suggestion)
                  setShowUsernameSuggestions(false)
                }}
                visible={showUsernameSuggestions}
                onClose={() => setShowUsernameSuggestions(false)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Password
              </label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="form-input pr-10 font-mono"
                    placeholder="Enter or generate password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-text"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="form-button"
                  title="Generate secure password"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="form-button"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* URL */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="form-input"
                placeholder="https://example.com"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="form-input resize-none"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            {/* TOTP Section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <label className="text-sm font-medium text-text">
                    Two-Factor Authentication (2FA)
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableTOTP(!enableTOTP)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    enableTOTP ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-text transition-transform ${
                    enableTOTP ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {enableTOTP && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 border border-border rounded-lg p-4 bg-glass/20"
                >
                  {/* Manual Secret Input */}
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      TOTP Secret (Base32)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={formData.totpSecret}
                        onChange={(e) => handleInputChange('totpSecret', e.target.value.toUpperCase())}
                        className="form-input flex-1 font-mono"
                        placeholder="JBSWY3DPEHPK3PXP"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const secret = generateTOTPSecret()
                          setFormData(prev => ({ ...prev, totpSecret: secret }))
                        }}
                        className="form-button"
                        title="Generate new TOTP secret"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowQRScanner(true)}
                        className="form-button"
                        title="Scan QR code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* URL Parser */}
                  <div>
                    <label className="block text-sm font-medium text-muted mb-1">
                      Import from URL (otpauth://)
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={totpUrl}
                        onChange={(e) => {
                          setTotpUrl(e.target.value)
                          const parsed = parseTOTPUrl(e.target.value)
                          if (parsed) {
                            setFormData(prev => ({
                              ...prev,
                              totpSecret: parsed.secret,
                              title: parsed.label || prev.title
                            }))
                          }
                        }}
                        className="form-input flex-1"
                        placeholder="otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP"
                      />
                      <button
                        type="button"
                        disabled={!totpUrl}
                        onClick={() => {
                          navigator.clipboard.readText().then(text => {
                            setTotpUrl(text)
                            const parsed = parseTOTPUrl(text)
                            if (parsed) {
                              setFormData(prev => ({
                                ...prev,
                                totpSecret: parsed.secret,
                                title: parsed.label || prev.title
                              }))
                            }
                          }).catch(console.error)
                        }}
                        className="form-button"
                        title="Paste URL from clipboard"
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* TOTP Preview */}
                  {formData.totpSecret && isValidTOTPSecret(formData.totpSecret) && (
                    <div className="bg-surface border border-border rounded p-3">
                      <div className="text-sm text-muted mb-1">TOTP Preview:</div>
                      <div className="font-mono text-lg text-text">
                        Testing TOTP: {generateTOTPToken(formData.totpSecret)?.token || 'Invalid'}
                      </div>
                    </div>
                  )}

                  {/* Backup Codes */}
                  {formData.totpSecret && (
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Recovery Codes (Auto-generated for backup)
                      </label>
                      {formData.backupCodes.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            const codes = generateBackupCodes(8)
                            setFormData(prev => ({ ...prev, backupCodes: codes }))
                          }}
                          className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm"
                        >
                          Generate Backup Codes
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            {formData.backupCodes.map((code, index) => (
                              <div key={index} className="bg-surface border border-border rounded p-2 text-center font-mono text-sm">
                                {code}
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const codes = generateBackupCodes(8)
                              setFormData(prev => ({ ...prev, backupCodes: codes }))
                            }}
                            className="w-full py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors text-sm"
                          >
                            Regenerate Codes
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 rounded p-3">
                <p className="text-error text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-muted/20 hover:bg-muted/30"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="flex-1"
              >
                {loading ? 'Saving...' : (isEditing ? 'Update Entry' : 'Add Entry')}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanned={handleQRScanned}
        title="Scan TOTP QR Code"
      />
    </AnimatePresence>
  )
}

export default AddEntryModal
