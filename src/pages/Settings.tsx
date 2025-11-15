import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Shield, Palette, Lock, Download, ArrowLeft, Save, RotateCcw, Fingerprint, X } from 'lucide-react'
import { useVault } from '../contexts/VaultContext'
import ThemeSelector from '../components/ThemeSelector'
import {
  isWebAuthnSupported,
  isBiometricEnabled,
  registerBiometricCredential,
  getStoredCredentials,
  removeCredential,
  saveCredential
} from '../lib/webauthn'
import type { WebAuthnCredential } from '../lib/webauthn'
import { useInfoToast, useErrorToast } from '../contexts/ToastContext'

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { lock } = useVault()

  // Settings state
  const [autoLockSettings, setAutoLockSettings] = useState({
    timeout: '15', // minutes
    enabled: true
  })
  const [securitySettings, setSecuritySettings] = useState({
    rateLimiting: true,
    clipboardTimeout: '30',
    autoClipboardClear: true
  })
  const [biometricSettings, setBiometricSettings] = useState({
    isSupported: false,
    isEnabled: false,
    credentials: [] as WebAuthnCredential[],
    isSettingUp: false
  })

  const showToast = useInfoToast()
  const showError = useErrorToast()

  // Initialize biometric settings on mount
  useEffect(() => {
    const isSupported = isWebAuthnSupported()
    const isEnabled = isBiometricEnabled()
    const credentials = getStoredCredentials()

    setBiometricSettings({
      isSupported,
      isEnabled,
      credentials,
      isSettingUp: false
    })
  }, [])

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('vault_settings_auto_lock', JSON.stringify(autoLockSettings))
    localStorage.setItem('vault_settings_security', JSON.stringify(securitySettings))

    // Could show success toast
    alert('Settings saved successfully!')
  }

  const handleResetSettings = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setAutoLockSettings({ timeout: '15', enabled: true })
      setSecuritySettings({ rateLimiting: true, clipboardTimeout: '30', autoClipboardClear: true })
      localStorage.removeItem('vault_settings_auto_lock')
      localStorage.removeItem('vault_settings_security')
      alert('Settings reset to defaults!')
    }
  }

  // Biometric settings handlers
  const handleSetupBiometric = async () => {
    if (!biometricSettings.isSupported) {
      showError('Biometric authentication is not supported on this device')
      return
    }

    setBiometricSettings(prev => ({ ...prev, isSettingUp: true }))

    try {
      const credential = await registerBiometricCredential()
      saveCredential(credential)

      setBiometricSettings(prev => ({
        ...prev,
        isEnabled: true,
        credentials: [...prev.credentials, credential],
        isSettingUp: false
      }))

      showToast('Biometric authentication set up successfully', 3000)
    } catch (error: any) {
      console.error('Biometric setup failed:', error)
      showError(error.message || 'Failed to set up biometric authentication')
      setBiometricSettings(prev => ({ ...prev, isSettingUp: false }))
    }
  }

  const handleRemoveBiometric = (credentialId: string) => {
    if (window.confirm('Remove this biometric credential? You will need to set up biometrics again to use this feature.')) {
      removeCredential(credentialId)
      setBiometricSettings(prev => ({
        ...prev,
        credentials: prev.credentials.filter(c => c.id !== credentialId),
        isEnabled: prev.credentials.filter(c => c.id !== credentialId).length > 0
      }))
      showToast('Biometric credential removed', 2000)
    }
  }

  return (
    <div className="min-h-screen bg-bg">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-text">Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetSettings}
                className="p-2 text-muted hover:text-text transition-colors"
                title="Reset settings"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleSaveSettings}
                className="flex items-center space-x-2 px-3 py-2 bg-accent hover:bg-accent/90 text-text rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>

              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3 py-2 text-muted hover:text-text transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="space-y-8">

          {/* Auto-Lock Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Auto-Lock</h3>
                <p className="text-sm text-muted">Automatically lock vault after inactivity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted">Enable Auto-Lock</label>
                <button
                  onClick={() => setAutoLockSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoLockSettings.enabled ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-text transition-transform ${
                    autoLockSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {autoLockSettings.enabled && (
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-muted">Lock after:</label>
                  <select
                    value={autoLockSettings.timeout}
                    onChange={(e) => setAutoLockSettings(prev => ({ ...prev, timeout: e.target.value }))}
                    className="form-input"
                  >
                    <option value="1">1 minute</option>
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="0">Never</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>

          {/* Vault Themes */}
          <ThemeSelector />

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-error/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Security</h3>
                <p className="text-sm text-muted">Advanced security options</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-muted">Rate Limiting</label>
                  <p className="text-xs text-muted">Protect against brute force attacks</p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({ ...prev, rateLimiting: !prev.rateLimiting }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.rateLimiting ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-text transition-transform ${
                    securitySettings.rateLimiting ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-muted">Auto Clipboard Clear</label>
                  <p className="text-xs text-muted">Clear copied passwords after timeout</p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({ ...prev, autoClipboardClear: !prev.autoClipboardClear }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.autoClipboardClear ? 'bg-accent' : 'bg-muted'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-text transition-transform ${
                    securitySettings.autoClipboardClear ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {securitySettings.autoClipboardClear && (
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-muted">Clear after:</label>
                  <select
                    value={securitySettings.clipboardTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, clipboardTimeout: e.target.value }))}
                    className="form-input"
                  >
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>

          {/* Biometric Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Biometric Unlock</h3>
                <p className="text-sm text-muted">
                  {biometricSettings.isSupported
                    ? 'Use fingerprint, face recognition, or PIN for quick access'
                    : 'Biometric authentication not supported on this device'
                  }
                </p>
              </div>
            </div>

            {biometricSettings.isSupported ? (
              <div className="space-y-4">
                {!biometricSettings.isEnabled ? (
                  <div className="text-center">
                    <button
                      onClick={handleSetupBiometric}
                      disabled={biometricSettings.isSettingUp}
                      className="w-full max-w-xs mx-auto flex items-center justify-center space-x-2 py-3 px-6 bg-accent hover:bg-accent/90 text-text rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Fingerprint className="w-5 h-5" />
                      <span>
                        {biometricSettings.isSettingUp ? 'Setting up...' : 'Set up Biometric'}
                      </span>
                    </button>
                    <p className="text-xs text-muted mt-2">
                      Enables fingerprint, Face ID, or Windows Hello for vault unlock
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center text-green-600">
                      <Shield className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Biometric authentication enabled</span>
                    </div>

                    {biometricSettings.credentials.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-muted">Registered devices:</label>
                        {biometricSettings.credentials.map((credential) => (
                          <div
                            key={credential.id}
                            className="flex items-center justify-between p-3 bg-glass/20 border border-border rounded"
                          >
                            <div>
                              <div className="font-medium text-sm">{credential.deviceName}</div>
                              <div className="text-xs text-muted">
                                Added {new Date(credential.createdAt).toLocaleDateString()}
                                {credential.lastUsed && ` • Last used ${new Date(credential.lastUsed).toLocaleDateString()}`}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveBiometric(credential.id)}
                              className="p-1 text-error hover:text-error/80 transition-colors"
                              title="Remove this biometric credential"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm text-muted">Want to add another device?</span>
                      <button
                        onClick={handleSetupBiometric}
                        disabled={biometricSettings.isSettingUp}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                      >
                        Add biometric
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-muted">
                  <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Biometric authentication requires a modern browser and compatible hardware.</p>
                  <p className="text-xs mt-1">Try Chrome, Firefox, or Safari on supported devices.</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Vault Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-border rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Vault Actions</h3>
                <p className="text-sm text-muted">Backup and maintenance</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('Backup export would open here')}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors border border-accent/50"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Backup</span>
              </button>

              <button
                onClick={() => alert('Import backup would open here')}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-lg transition-colors border border-accent/50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span className="text-sm font-medium">Import Backup</span>
              </button>

              <button
                onClick={lock}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-error hover:bg-error/90 text-text rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Lock Vault</span>
              </button>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-20 text-center text-muted text-sm">
        <div className="max-w-4xl mx-auto px-6">
          <p>&copy; 2025 <strong>Lynqar</strong>. Made in India with ❤️. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="trust-badge">Open Source</span>
            <span className="trust-badge">AES-256 Encrypted</span>
            <span className="trust-badge">Zero Cloud</span>
          </div>
        </div>
      </footer>

    </div>
  )
}

export default Settings
