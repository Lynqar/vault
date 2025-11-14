import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useVault } from '../contexts/VaultContext'
import type { VaultEntry } from '../vault'
import { Button } from '../ui'
import VaultEntryItem from '../components/VaultEntryItem'
import AddEntryModal from '../components/AddEntryModal'
import VaultHeader from '../components/VaultHeader'
import { db } from '../lib/db'

const Vault: React.FC = () => {
  const { entries, unlocked, lock } = useVault()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null)
  const [checkingVault, setCheckingVault] = useState(true)

  useEffect(() => {
    checkVaultStatus()
  }, [])

  const checkVaultStatus = async () => {
    try {
      const saltRow = await db.meta.get('salt')
      if (!saltRow) {
        // No vault exists, show onboarding internally or redirect
        alert('No vault found. Please create one.')
        // Since standalone, perhaps redirect to unlock or onboarding
        lock() // or something
      } else if (!unlocked) {
        alert('Vault locked. Please unlock.')
        lock()
      }
    } catch (error) {
      console.error('Error checking vault status:', error)
    } finally {
      setCheckingVault(false)
    }
  }

  if (checkingVault) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-400">Checking vault status...</p>
        </div>
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-4">Vault Locked</h2>
          <p className="text-slate-400 mb-6">Please unlock the vault.</p>
          <Button onClick={() => lock()}>
            Go to Unlock
          </Button>
        </div>
      </div>
    )
  }

  const handleEdit = (entry: VaultEntry) => {
    setEditingEntry(entry)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingEntry(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <VaultHeader onLock={lock} />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Password Vault</h1>
              <p className="text-slate-400">
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'} stored securely
              </p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              Add Entry
            </Button>
          </div>
        </div>

        {entries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl text-indigo-400">lock</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No entries yet</h3>
            <p className="text-slate-400 mb-6">Add your first password entry to get started.</p>
            <Button onClick={() => setShowAddModal(true)}>
              Add Your First Entry
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {entries.map((entry, index) => (
              <VaultEntryItem
                key={entry.id}
                entry={entry}
                onEdit={handleEdit}
                index={index}
              />
            ))}
          </motion.div>
        )}
      </main>

      {showAddModal && (
        <AddEntryModal
          entry={editingEntry}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default Vault
