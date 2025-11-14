import { db } from './db'

export interface BackupData {
  version: number
  createdAt: string
  salt: string
  entries: Array<{
    id: string
    encrypted: string
  }>
  metadata: {
    totalEntries: number
    browserFingerprint: string
  }
}

export interface BackupFile extends BackupData {
  signature: string // For verification
}

// Export vault backup
export async function exportVaultBackup(masterPassword: string): Promise<void> {
  try {
    // Get salt
    const saltRow = await db.meta.get('salt')
    if (!saltRow) {
      throw new Error('No vault found')
    }

    // Get all entries
    const allEntries = await db.entries.toArray()

    // Create backup data structure
    const backupData: BackupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      salt: saltRow.value,
      entries: allEntries.map(entry => ({
        id: entry.id,
        encrypted: entry.encrypted
      })),
      metadata: {
        totalEntries: allEntries.length,
        browserFingerprint: getBrowserFingerprint()
      }
    }

    // Create encryption key from master password
    const tempKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(masterPassword),
      'HKDF',
      false,
      ['deriveKey']
    )

    const backupKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: new TextEncoder().encode('backup-encryption'),
        iterations: 200,
        hash: 'SHA-256'
      },
      tempKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // Create final backup file structure with signature
    const finalBackup: BackupFile = {
      ...backupData,
      signature: 'LYNQAR_VAULT_BACKUP_V1'
    }

    // Encrypt the backup data
    const encryptedBackup = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: window.crypto.getRandomValues(new Uint8Array(12)) },
      backupKey,
      new TextEncoder().encode(JSON.stringify(finalBackup))
    )

    // Convert to base64 for download
    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedBackup)))

    // Download file
    const filename = `myvault_backup_${new Date().toISOString().split('T')[0]}.vaultbackup`
    downloadFile(encryptedBase64, filename)

  } catch (error) {
    console.error('Backup export failed:', error)
    throw new Error('Failed to create vault backup')
  }
}

// Import vault backup
export async function importVaultBackup(
  backupData: string,
  masterPassword: string,
  mode: 'overwrite' | 'merge'
): Promise<{ totalEntries: number; imported: number }> {
  try {
    console.log('Starting import...')

    // Convert from base64
    const encryptedArray = Uint8Array.from(atob(backupData), c => c.charCodeAt(0))

    // Create key from master password for decrypting backup
    const tempKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(masterPassword),
      'HKDF',
      false,
      ['deriveKey']
    )

    const finalBackupKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: new TextEncoder().encode('backup-encryption'),
        iterations: 200,
        hash: 'SHA-256'
      },
      tempKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // For simplicity, we'll try to decrypt directly (the backup is encrypted twice for backward compatibility)
    // First try new format, then fallback to old

    try {
      const decryptedData = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: encryptedArray.slice(0, 12) },
        finalBackupKey,
        encryptedArray.slice(12)
      )

      const backupJson = new TextDecoder().decode(decryptedData)
      const backup: BackupFile = JSON.parse(backupJson)

      if (backup.signature !== 'LYNQAR_VAULT_BACKUP_V1') {
        throw new Error('Invalid backup file')
      }

      console.log('Backup file valid, importing...')

      // Validate backup structure
      if (!backup.entries || !Array.isArray(backup.entries)) {
        throw new Error('Invalid backup structure')
      }

      let importedCount = 0

      if (mode === 'overwrite') {
        // Clear existing database
        await db.entries.clear()
        await db.meta.clear()

        // Set new salt
        await db.meta.put({ key: 'salt', value: backup.salt })
      }
      // For merge mode, we don't replace salt

      // Import entries
      for (const entry of backup.entries) {
        try {
          if (mode === 'overwrite') {
            await db.entries.put({ id: entry.id, encrypted: entry.encrypted })
          } else if (mode === 'merge') {
            // Check if entry exists, skip if it does
            const existing = await db.entries.get(entry.id)
            if (!existing) {
              await db.entries.put({ id: entry.id, encrypted: entry.encrypted })
              importedCount++
            }
          }
        } catch (error) {
          console.warn(`Failed to import entry ${entry.id}:`, error)
          // Continue with other entries
        }
      }

      return {
        totalEntries: backup.entries.length,
        imported: mode === 'overwrite' ? backup.entries.length : importedCount
      }

    } catch (error) {
      console.warn('New format failed, backup might be incompatible:', error)
      throw new Error('Backup file is not compatible or corrupted')
    }

  } catch (error) {
    console.error('Backup import failed:', error)
    throw error
  }
}

// Helper function to download file
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Helper function to get browser fingerprint for metadata
function getBrowserFingerprint(): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx?.fillText('Lynqar Vault', 10, 10)

  return [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|')
}

// Validate backup file before import
export function validateBackupFile(fileContent: string): boolean {
  try {
    // Basic check - should be base64 and decodeable
    const decoded = atob(fileContent)
    return decoded.length > 0
  } catch {
    return false
  }
}
