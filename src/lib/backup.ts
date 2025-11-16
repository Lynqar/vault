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
  checksum: string // HMAC-SHA256 of encrypted data for integrity
  keyFingerprint: string // Hash of derived key for additional validation
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

    // Create checksum (HMAC-SHA256) for integrity verification
    const checksumKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        salt: new TextEncoder().encode('backup-checksum'),
        info: new TextEncoder().encode('backup-integrity'),
        hash: 'SHA-256'
      },
      tempKey,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const dataString = JSON.stringify(backupData)
    const checksumBuffer = await window.crypto.subtle.sign('HMAC', checksumKey, new TextEncoder().encode(dataString))
    const checksum = btoa(String.fromCharCode(...new Uint8Array(checksumBuffer)))

    // Create key fingerprint (SHA-256 hash of the derived key)
    const keyFingerprint = await window.crypto.subtle.sign('HMAC', checksumKey, new TextEncoder().encode('key-verification'))
    const fingerprintB64 = btoa(String.fromCharCode(...new Uint8Array(keyFingerprint)))

    // Create final backup file structure with signature and security enhancements
    const finalBackup: BackupFile = {
      ...backupData,
      signature: 'LYNQAR_VAULT_BACKUP_V1',
      checksum: checksum,
      keyFingerprint: fingerprintB64
    }

    // Encrypt the backup data
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encryptedBackup = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      backupKey,
      new TextEncoder().encode(JSON.stringify(finalBackup))
    )

    // Prepend IV to encrypted data for decryption
    const combined = new Uint8Array(iv.length + encryptedBackup.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBackup), iv.length)

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
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)

    // Convert from base64
// Import vault backup
export async function importVaultBackup(
  backupData: string,
  masterPassword: string,
  mode: 'overwrite' | 'merge'
): Promise<{ totalEntries: number; imported: number }> {
  try {

    // Convert from base64
=======
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)

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
        throw new Error('Invalid backup file signature')
      }

      // Verify checksum for data integrity
      const checksumKey = await window.crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          salt: new TextEncoder().encode('backup-checksum'),
          info: new TextEncoder().encode('backup-integrity'),
          hash: 'SHA-256'
        },
        tempKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const backupData: BackupData = {
        version: backup.version,
        createdAt: backup.createdAt,
        salt: backup.salt,
        entries: backup.entries,
        metadata: backup.metadata
      }

      const dataString = JSON.stringify(backupData)
      const computedChecksum = await window.crypto.subtle.sign('HMAC', checksumKey, new TextEncoder().encode(dataString))
      const computedChecksumB64 = btoa(String.fromCharCode(...new Uint8Array(computedChecksum)))

      // Compare computed checksum with stored checksum
      if (computedChecksumB64 !== backup.checksum) {
        throw new Error('Backup integrity check failed - file may be corrupted or tampered with')
      }

      // Optionally verify key fingerprint (can be used for cross-device validation)
<<<<<<< HEAD
      console.log('Backup integrity verified successfully')

      console.log('Backup file valid, importing...')
=======
>>>>>>> 2da5a03 (Remove debug console.logs and implement missing mobile dock features)

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
