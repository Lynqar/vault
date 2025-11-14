import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useVault } from '../contexts/VaultContext'
import { Button } from '../ui'
import { Shield, Lock } from 'lucide-react'

const VaultUnlock: React.FC = () => {
  const { unlock } = useVault()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await unlock(password)
      if (!success) {
        setError('Invalid password. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('Failed to unlock vault.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Unlock Your Vault</h1>
          <p className="text-slate-400">Enter your master password to access your password vault</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Master Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
              required
               />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || !password} className="w-full py-3">
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

export default VaultUnlock
