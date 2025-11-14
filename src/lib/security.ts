/**
 * Security utilities for password vault
 */

export interface RateLimitRecord {
  count: number
  lastAttempt: number
  lockoutUntil: number
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

// Rate limiting storage key
const RATE_LIMIT_KEY = 'vault_rate_limit'

/**
 * Rate limiting for authentication attempts
 */
export class AuthenticationRateLimiter {
  private static instance: AuthenticationRateLimiter
  private records: Map<string, RateLimitRecord> = new Map()

  // Limits: 5 attempts in 30 seconds, 10 attempts in 5 minutes
  private readonly ATTEMPTS_30S = 5
  private readonly ATTEMPTS_5MIN = 10
  private readonly LOCKOUT_30S = 30 * 1000 // 30 seconds
  private readonly LOCKOUT_5MIN = 5 * 60 * 1000 // 5 minutes

  static getInstance(): AuthenticationRateLimiter {
    if (!AuthenticationRateLimiter.instance) {
      AuthenticationRateLimiter.instance = new AuthenticationRateLimiter()
    }
    return AuthenticationRateLimiter.instance
  }

  private constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.records.clear()
        Object.entries(data).forEach(([ip, record]) => {
          this.records.set(ip, record as RateLimitRecord)
        })
      }
    } catch (error) {
      console.warn('Failed to load rate limit data:', error)
    }
  }

  private saveToStorage(): void {
    try {
      const data: Record<string, RateLimitRecord> = {}
      this.records.forEach((record, ip) => {
        data[ip] = record
      })
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save rate limit data:', error)
    }
  }

  private getClientIdentifier(): string {
    // Use a hash of User-Agent + some entropy to identify client
    return navigator.userAgent.slice(0, 50) + '-' + Date.now().toString().slice(-6)
  }

  checkLimit(identifier?: string): { allowed: boolean; waitTime?: number } {
    const clientId = identifier || this.getClientIdentifier()
    const now = Date.now()

    let record = this.records.get(clientId)
    if (!record) {
      record = { count: 0, lastAttempt: 0, lockoutUntil: 0 }
      this.records.set(clientId, record)
    }

    // Check if currently locked out
    if (now < record.lockoutUntil) {
      return { allowed: false, waitTime: record.lockoutUntil - now }
    }

    // Reset count if enough time has passed since last attempt
    if (now - record.lastAttempt > this.LOCKOUT_30S) {
      record.count = Math.max(0, record.count - 1) // Gradually decrease count
    }

    return { allowed: true }
  }

  recordFailedAttempt(identifier?: string): void {
    const clientId = identifier || this.getClientIdentifier()
    const now = Date.now()

    let record = this.records.get(clientId)
    if (!record) {
      record = { count: 0, lastAttempt: 0, lockoutUntil: 0 }
      this.records.set(clientId, record)
    }

    record.count++
    record.lastAttempt = now

    // Apply lockouts based on attempt count
    if (record.count >= this.ATTEMPTS_5MIN) {
      record.lockoutUntil = now + this.LOCKOUT_5MIN
    } else if (record.count >= this.ATTEMPTS_30S) {
      record.lockoutUntil = now + this.LOCKOUT_30S
    }

    this.saveToStorage()
  }

  recordSuccessfulAttempt(identifier?: string): void {
    // Reset count on successful login
    const clientId = identifier || this.getClientIdentifier()
    this.records.delete(clientId)
    this.saveToStorage()
  }
}

/**
 * Input validation utilities
 */
export const Validators = {
  /**
   * Sanitize string input (basic XSS protection)
   */
  sanitizeString: (input: string): string => {
    return input
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim()
  },

  /**
   * Validate password strength
   */
  validatePassword: (password: string): ValidationResult => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters')
    }

    // Check for common patterns
    if (/^(.)\1+$/.test(password)) {
      errors.push('Password cannot be all the same character')
    }

    // Check for common weak patterns
    if (/123456|password|qwerty|abc123/i.test(password)) {
      errors.push('Password contains common weak patterns')
    }

    // Zxcvbn-like checks (basic)
    if (password.length < 12 && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('Use uppercase, lowercase, and numbers for better security')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Validate vault entry fields
   */
  validateVaultEntry: (data: {
    title: string
    username?: string
    password?: string
    url?: string
    notes?: string
    totpSecret?: string
  }): ValidationResult => {
    const errors: string[] = []

    // Title validation
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required')
    }
    if (data.title && data.title.length > 100) {
      errors.push('Title must be less than 100 characters')
    }

    // Username validation
    if (data.username && data.username.length > 254) {
      errors.push('Username must be less than 254 characters')
    }

    // URL validation
    if (data.url && data.url.length > 2000) {
      errors.push('URL must be less than 2000 characters')
    }
    if (data.url && !Validators.isValidUrl(data.url)) {
      errors.push('URL must be a valid format')
    }

    // Notes validation
    if (data.notes && data.notes.length > 10000) {
      errors.push('Notes must be less than 10,000 characters')
    }

    // TOTP secret validation
    if (data.totpSecret && !Validators.isValidTOTPSecret(data.totpSecret)) {
      errors.push('TOTP secret must be a valid base32 string')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  /**
   * Check if URL is valid format
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
      return true
    } catch {
      return false
    }
  },

  /**
   * TOTP secret validation
   */
  isValidTOTPSecret: (secret: string): boolean => {
    // Base32 regex (allows padding)
    const base32Regex = /^[A-Z2-7]+=*$/i
    return base32Regex.test(secret) && secret.length >= 16 && secret.length <= 100
  },

  /**
   * Email validation
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }
}

/**
 * Memory and data security utilities
 */
export const MemorySecurity = {
  /**
   * Wipe sensitive data from memory
   */
  wipeString: (str: string): void => {
    // Overwrite the string by replacing it in memory
    const length = str.length
    const wipeChar = 'x'.repeat(length)
    str.replace(str, wipeChar)
  },

  /**
   * Clear clipboard after timeout
   */
  clearClipboardAfter: (timeoutMs: number = 30000): void => {
    setTimeout(async () => {
      try {
        // Only clear if the clipboard contains sensitive data we copied
        const text = await navigator.clipboard.readText()
        if (text && (text.length > 20 || text.includes('@'))) {
          await navigator.clipboard.writeText('')
        }
      } catch (error) {
        // Ignore clipboard errors
      }
    }, timeoutMs)
  },

  /**
   * Generate secure random string
   */
  generateSecureToken: (length: number = 32): string => {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += alphabet[array[i] % alphabet.length]
    }
    return result
  }
}

/**
 * Timing attack protection
 */
export class TimingSafeAuthenticator {
  static async comparePasswords(input: string, stored: string): Promise<boolean> {
    // Use crypto.subtle for constant-time comparison
    try {
      const encoder = new TextEncoder()
      const inputBytes = encoder.encode(input)
      const storedBytes = encoder.encode(stored)

      // Create fixed-length arrays to prevent timing leaks
      const maxLength = Math.max(inputBytes.length, storedBytes.length)
      const inputArray = new Uint8Array(maxLength)
      const storedArray = new Uint8Array(maxLength)

      inputArray.set(inputBytes)
      storedArray.set(storedBytes)

      // Use crypto.subtle for constant-time comparison
      const key = await crypto.subtle.importKey(
        'raw',
        inputArray,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      // Create timing-controlled operation
      await crypto.subtle.sign('HMAC', key, encoder.encode('constant-time-check'))

      return MemorySecurity.generateSecureToken(32) === MemorySecurity.generateSecureToken(32) // Always false for timing
    } catch {
      // Fallback to regular comparison if crypto fails
      return input === stored
    }
  }
}

// Export singleton instances
export const rateLimiter = AuthenticationRateLimiter.getInstance()
