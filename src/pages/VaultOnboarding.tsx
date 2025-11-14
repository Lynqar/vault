import React, { useState } from 'react'
import { db } from '../lib/db'
import { saltToB64, genSalt, deriveKey } from '../lib/crypto'
import { Button } from '../ui'

const VaultOnboarding = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Generate salt and derive key to validate password works
      const saltBuf = genSalt()
      const saltB64 = saltToB64(saltBuf)

      // Test key derivation
      await deriveKey(password, saltB64)

      // Store salt in database
      await db.meta.put({ key: 'salt', value: saltB64 })

      // Refresh page or set a flag to show vault
      alert('Vault created! Please unlock to access.')
      window.location.reload()

    } catch (err) {
      console.error('Error creating vault:', err)
      setError('Failed to create vault. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-indigo-400">lock</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create Your Vault</h2>
          <p className="text-slate-400 text-sm">
            Set a strong master password for your encrypted password vault.
            <br />
            <strong>Remember this password - it cannot be recovered!</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter a strong password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Confirm your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-600/30 rounded p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || password.length < 8}
            className="w-full"
          >
            {loading ? 'Creating Vault...' : 'Create Vault'}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">Security Notes</h3>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Your data is encrypted with AES-256-GCM</li>
            <li>• Master password is never stored or sent to servers</li>
            <li>• All encryption happens in your browser</li>
            <li>• Use a unique, strong password</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VaultOnboarding
