/**
 * Secure clipboard management service
 */

export interface ClipboardEntry {
  id: string
  content: string
  type: 'password' | 'username' | 'totp' | 'text'
  timestamp: number
  autoClearMs?: number
}

class SecureClipboardManager {
  private static instance: SecureClipboardManager
  private activeEntries: Map<string, ClipboardEntry> = new Map()
  private clearTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  private clearCallbacks: Map<string, () => void> = new Map()
  private storageKey = 'vault_clipboard_state'

  static getInstance(): SecureClipboardManager {
    if (!SecureClipboardManager.instance) {
      SecureClipboardManager.instance = new SecureClipboardManager()
    }
    return SecureClipboardManager.instance
  }

  private constructor() {
    this.loadState()
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup())
  }

  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        // Restore any pending clears from last session
        const now = Date.now()
        data.entries?.forEach((entry: ClipboardEntry) => {
          if (entry.autoClearMs && now - entry.timestamp < entry.autoClearMs) {
            const remaining = entry.autoClearMs - (now - entry.timestamp)
            this.scheduleClear(entry.id, remaining)
          }
        })
      }
    } catch (error) {
      console.warn('Failed to load clipboard state:', error)
    }
  }

  private saveState(): void {
    try {
      const entries = Array.from(this.activeEntries.values())
      const data = { entries, lastSaved: Date.now() }
      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save clipboard state:', error)
    }
  }

  /**
   * Copy text to clipboard securely
   */
  async copyText(text: string, type: ClipboardEntry['type'] = 'text', autoClearMs?: number): Promise<string> {
    const entryId = crypto.randomUUID()

    try {
      await navigator.clipboard.writeText(text)

      const entry: ClipboardEntry = {
        id: entryId,
        content: text,
        type,
        timestamp: Date.now(),
        autoClearMs
      }

      this.activeEntries.set(entryId, entry)

      // Schedule auto-clear if configured
      if (autoClearMs && autoClearMs > 0) {
        this.scheduleClear(entryId, autoClearMs)
      }

      this.saveState()
      return entryId

    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      throw error
    }
  }

  /**
   * Copy sensitive data with auto-clear
   */
  async copySensitive(text: string, type: 'password' | 'totp' | 'username' = 'password'): Promise<string> {
    const autoClearMs = this.getAutoClearTimeout() * 1000 // Convert to milliseconds
    return this.copyText(text, type, autoClearMs)
  }

  /**
   * Manually clear clipboard
   */
  async clearClipboard(partial: boolean = false): Promise<void> {
    try {
      await navigator.clipboard.writeText('')
      this.clearAllActive()
    } catch (error) {
      console.error('Failed to clear clipboard:', error)
      if (!partial) {
        // Try insecure fallback on mobile (limited effectiveness)
        this.insecureFallbackClear()
      }
    }
  }

  /**
   * Check if sensitive data is currently in clipboard
   */
  async hasSensitiveData(): Promise<boolean> {
    try {
      const text = await navigator.clipboard.readText()
      return this.isSensitiveText(text)
    } catch {
      return false
    }
  }

  /**
   * Get current auto-clear timeout from settings
   */
  getAutoClearTimeout(): number {
    try {
      const settings = localStorage.getItem('vault_settings_security')
      if (settings) {
        const parsed = JSON.parse(settings)
        return parsed.autoClipboardClear ? parseInt(parsed.clipboardTimeout) || 30 : 0
      }
    } catch {
      // Ignore JSON parse errors
    }
    return 30 // Default 30 seconds
  }

  /**
   * Register callback for when clipboard is cleared
   */
  onClipboardCleared(callback: () => void): () => void {
    const callbackId = crypto.randomUUID()
    this.clearCallbacks.set(callbackId, callback)
    return () => this.clearCallbacks.delete(callbackId)
  }

  /**
   * Show notification when clipboard is cleared
   */
  private showClearNotification(type: ClipboardEntry['type']): void {
    // Use callbacks to notify components about clear events
    this.clearCallbacks.forEach(callback => callback())

    // The callback system allows components to show notifications
    // Individual components should register callbacks and show appropriate toasts
  }

  private scheduleClear(entryId: string, delayMs: number): void {
    // Clear any existing timer for this entry
    if (this.clearTimers.has(entryId)) {
      clearTimeout(this.clearTimers.get(entryId)!)
    }

    const timer = setTimeout(async () => {
      await this.clearClipboard(true) // Partial clear to avoid over-clearing

      // Show notification that clipboard was cleared
      const entry = this.activeEntries.get(entryId)
      if (entry) {
        this.showClearNotification(entry.type)
      }

      // Trigger callbacks
      this.clearCallbacks.forEach(callback => callback())

      // Remove from active entries
      this.activeEntries.delete(entryId)
      this.clearTimers.delete(entryId)
      this.saveState()

    }, delayMs)

    this.clearTimers.set(entryId, timer)
  }

  private clearAllActive(): void {
    // Clear all timeouts and active entries
    this.clearTimers.forEach(timer => clearTimeout(timer))
    this.clearTimers.clear()
    this.activeEntries.clear()
    this.saveState()
  }

  private isSensitiveText(text: string): boolean {
    // Consider text sensitive if it's long enough to be a password
    // or contains patterns typical of sensitive data
    return (
      text.length > 8 || // Longer passwords
      text.includes('@') || // Email-like
      /^\d{6}$/.test(text) || // 6-digit codes (TOTP)
      /^[A-Z2-7]+=*$/.test(text) // Base32 (TOTP secrets)
    )
  }

  /**
   * Fallback clear method (limited effectiveness)
   * Creates a temporary input and uses legacy copy
   */
  private insecureFallbackClear(): void {
    try {
      const tempInput = document.createElement('input')
      tempInput.value = ''
      document.body.appendChild(tempInput)
      tempInput.select()

      // Use deprecated but sometimes necessary execCommand
      if (document.execCommand) {
        document.execCommand('copy')
      }

      document.body.removeChild(tempInput)
    } catch (error) {
      console.error('Fallback clear failed:', error)
    }
  }

  private cleanup(): void {
    this.clearAllActive()
    this.clearCallbacks.clear()
  }
}

// Export singleton instance
export const secureClipboard = SecureClipboardManager.getInstance()

// Utility functions for common use cases
export const copyPassword = (password: string): Promise<string> => {
  return secureClipboard.copySensitive(password, 'password')
}

export const copyUsername = (username: string): Promise<string> => {
  return secureClipboard.copyText(username, 'username')
}

export const copyTOTPCode = (code: string): Promise<string> => {
  return secureClipboard.copySensitive(code, 'totp')
}

export const clearClipboard = (): Promise<void> => {
  return secureClipboard.clearClipboard()
}

export const hasSensitiveClipboard = (): Promise<boolean> => {
  return secureClipboard.hasSensitiveData()
}

// Settings integration
export const getClipboardAutoClearEnabled = (): boolean => {
  try {
    const settings = localStorage.getItem('vault_settings_security')
    return settings ? JSON.parse(settings).autoClipboardClear : true
  } catch {
    return true
  }
}

export const getClipboardAutoClearTimeout = (): number => {
  return secureClipboard.getAutoClearTimeout()
}
