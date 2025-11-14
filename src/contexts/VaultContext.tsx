import React, { createContext, useContext, useState, useEffect } from 'react'
import { db } from '../lib/db'
import { deriveKey, decryptJSON, encryptJSON } from '../lib/crypto'
import { rateLimiter, MemorySecurity } from '../lib/security'
import type { VaultEntry } from '../vault'

type VaultContextType = {
  unlocked: boolean
  unlock: (password: string) => Promise<{ success: boolean; rateLimit?: { waitTime: number } }>
  lock: () => void
  entries: VaultEntry[]
  addEntry: (entry: Omit<VaultEntry, 'id' | 'createdAt'>) => Promise<void>
  updateEntry: (id: string, entry: Omit<VaultEntry, 'id' | 'createdAt'>) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

const VaultContext = createContext<VaultContextType | undefined>(undefined)

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false)
  const [key, setKey] = useState<CryptoKey | null>(null)
  const [entries, setEntries] = useState<VaultEntry[]>([])

  useEffect(() => {
    // Check if vault exists on mount
    checkVaultExists()
  }, [])

  const checkVaultExists = async () => {
    try {
      const saltRow = await db.meta.get('salt')
      if (saltRow) {
        // Vault exists, user needs to unlock
        return
      }
    } catch (error) {
      console.error('Error checking vault:', error)
    }
  }

  async function unlock(password: string) {
    try {
      // Check rate limiting first
      const limitCheck = rateLimiter.checkLimit()
      if (!limitCheck.allowed) {
        return {
          success: false,
          rateLimit: { waitTime: limitCheck.waitTime! }
        }
      }

      const saltRow = await db.meta.get('salt')
      if (!saltRow) {
        rateLimiter.recordFailedAttempt()
        throw new Error('No vault found. Please create one first.')
      }

      const salt = saltRow.value
      const derived = await deriveKey(password, salt)

      // Try to decrypt all entries to verify password
      const all = await db.entries.toArray()
      const decoded: VaultEntry[] = []

      for (const r of all) {
        const parsed = JSON.parse(r.encrypted)
        const dec = await decryptJSON(derived, parsed)
        decoded.push(dec as VaultEntry)
      }

      // Clear password from memory
      MemorySecurity.wipeString(password)

      setKey(derived)
      setEntries(decoded)
      setUnlocked(true)

      // Record successful login
      rateLimiter.recordSuccessfulAttempt()

      return { success: true }
    } catch (e) {
      console.error('Unlock failed:', e)

      // Record failed attempt (but don't expose sensitive info in error)
      rateLimiter.recordFailedAttempt()

      return { success: false }
    }
  }

  async function lock() {
    setKey(null)
    setEntries([])
    setUnlocked(false)
  }

  async function addEntry(payload: Omit<VaultEntry, 'id' | 'createdAt'>) {
    if (!key) throw new Error('Vault is locked')

    const entry: VaultEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...payload
    }

    const encrypted = await encryptJSON(key, entry)
    await db.entries.put({ id: entry.id, encrypted: JSON.stringify(encrypted) })
    setEntries(prev => [entry, ...prev])
  }

  async function updateEntry(id: string, payload: Omit<VaultEntry, 'id' | 'createdAt'>) {
    if (!key) throw new Error('Vault is locked')

    const entry: VaultEntry = {
      id,
      createdAt: entries.find(e => e.id === id)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    }

    const encrypted = await encryptJSON(key, entry)
    await db.entries.put({ id: entry.id, encrypted: JSON.stringify(encrypted) })
    setEntries(prev => prev.map(e => e.id === id ? entry : e))
  }

  async function deleteEntry(id: string) {
    await db.entries.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <VaultContext.Provider value={{
      unlocked,
      unlock,
      lock,
      entries,
      addEntry,
      updateEntry,
      deleteEntry
    }}>
      {children}
    </VaultContext.Provider>
  )
}

export function useVault() {
  const ctx = useContext(VaultContext)
  if (!ctx) throw new Error('useVault must be used within VaultProvider')
  return ctx
}
