import React, { useState } from 'react'
import { db } from '../lib/db'
import { saltToB64, genSalt, deriveKey } from '../lib/crypto'
import { Button } from '../ui'
import VaultHeader from '../components/VaultHeader'

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
    <div className="min-h-screen bg-bg">
      {/* Header - responsive with mobile menu */}
      <VaultHeader onLock={() => {}} onSettings={() => {}} />

      <div className={`flex items-center justify-center p-4 ${window.innerWidth >= 768 ? 'pt-28' : 'pt-8'}`}>
        <div className="w-full max-w-md bg-surface border border-border rounded-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-accent">lock</span>
          </div>
          <h2 className="text-lg font-bold text-text mb-2">Create Your Vault</h2>
          <p className="text-muted text-sm">
            Set a strong master password for your encrypted password vault.
            <br />
            <strong>Remember this password - it cannot be recovered!</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter a strong password"
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm your password"
              required
              minLength={8}
            />
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded p-3">
              <p className="text-error text-sm">{error}</p>
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

        <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded">
          <h3 className="text-sm font-semibold text-accent mb-2">Security Notes</h3>
          <ul className="text-xs text-muted space-y-1">
            <li>• Your data is encrypted with AES-256-GCM</li>
            <li>• Master password is never stored or sent to servers</li>
            <li>• All encryption happens in your browser</li>
            <li>• Use a unique, strong password</li>
          </ul>
        </div>
        </div>
      </div>
    </div>
  )
}

export default VaultOnboarding
