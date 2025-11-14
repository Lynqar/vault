import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Shield, Palette, Lock, Download, ArrowLeft, Save, RotateCcw } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import type { ThemeMode } from '../contexts/ThemeContext'
import { useVault } from '../contexts/VaultContext'

const Settings: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { theme, setTheme } = useTheme()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-white">Settings</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetSettings}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                title="Reset settings"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={handleSaveSettings}
                className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Save</span>
              </button>

              <button
                onClick={onBack}
                className="flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white transition-colors"
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
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Auto-Lock</h3>
                <p className="text-sm text-slate-400">Automatically lock vault after inactivity</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">Enable Auto-Lock</label>
                <button
                  onClick={() => setAutoLockSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoLockSettings.enabled ? 'bg-indigo-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoLockSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {autoLockSettings.enabled && (
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-slate-300">Lock after:</label>
                  <select
                    value={autoLockSettings.timeout}
                    onChange={(e) => setAutoLockSettings(prev => ({ ...prev, timeout: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Theme Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Appearance</h3>
                <p className="text-sm text-slate-400">Customize how Lynqar looks</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light' as ThemeMode, label: 'Light', icon: '☀️' },
                    { value: 'dark' as ThemeMode, label: 'Dark', icon: '🌙' },
                    { value: 'system' as ThemeMode, label: 'System', icon: '💻' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={`p-4 rounded-lg border transition-colors text-left ${
                        theme === option.value
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.icon}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Security</h3>
                <p className="text-sm text-slate-400">Advanced security options</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">Rate Limiting</label>
                  <p className="text-xs text-slate-400">Protect against brute force attacks</p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({ ...prev, rateLimiting: !prev.rateLimiting }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.rateLimiting ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    securitySettings.rateLimiting ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-300">Auto Clipboard Clear</label>
                  <p className="text-xs text-slate-400">Clear copied passwords after timeout</p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({ ...prev, autoClipboardClear: !prev.autoClipboardClear }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.autoClipboardClear ? 'bg-green-600' : 'bg-slate-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    securitySettings.autoClipboardClear ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {securitySettings.autoClipboardClear && (
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium text-slate-300">Clear after:</label>
                  <select
                    value={securitySettings.clipboardTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, clipboardTimeout: e.target.value }))}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {/* Vault Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Vault Actions</h3>
                <p className="text-sm text-slate-400">Backup and maintenance</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => alert('Backup export would open here')}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Backup</span>
              </button>

              <button
                onClick={() => alert('Import backup would open here')}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span className="text-sm font-medium">Import Backup</span>
              </button>

              <button
                onClick={lock}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Lock Vault</span>
              </button>
            </div>
          </motion.div>

        </div>
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

    </div>
  )
}

export default Settings
