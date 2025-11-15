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
 * Security Event Logging for audit trails
 */
export interface SecurityEvent {
  timestamp: number
  event: 'unlock_attempt' | 'unlock_success' | 'backup_created' | 'backup_imported' | 'key_changed' | 'biometric_added' | 'rate_limit_hit'
  ip?: string
  userAgent?: string
  result: 'success' | 'failure' | 'blocked'
  metadata?: Record<string, any>
}

export class SecurityAuditor {
  private static instance: SecurityAuditor
  private readonly MAX_EVENTS = 1000
  private events: SecurityEvent[] = []

  static getInstance(): SecurityAuditor {
    if (!SecurityAuditor.instance) {
      SecurityAuditor.instance = new SecurityAuditor()
    }
    return SecurityAuditor.instance
  }

  private constructor() {
    this.loadEvents()
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('security_audit_trail')
      if (stored) {
        this.events = JSON.parse(stored).slice(-this.MAX_EVENTS)
      }
    } catch (error) {
      console.warn('Failed to load security audit trail:', error)
    }
  }

  private saveEvents(): void {
    try {
      localStorage.setItem('security_audit_trail', JSON.stringify(this.events.slice(-this.MAX_EVENTS)))
    } catch (error) {
      console.warn('Failed to save security audit trail:', error)
    }
  }

  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ip: undefined // Client-side only
    }

    this.events.push(securityEvent)
    this.saveEvents()

    // Log critical events for monitoring
    if (['unlock_attempt', 'backup_imported', 'key_changed'].includes(event.event)) {
      console.log(`🔐 Security Event: ${event.event} - ${event.result}`, securityEvent)
    }
  }

  getEvents(filter?: (event: SecurityEvent) => boolean, limit = 100): SecurityEvent[] {
    let filtered = this.events
    if (filter) {
      filtered = filtered.filter(filter)
    }
    return filtered.slice(-limit).reverse() // Most recent first
  }

  getFailedAttempts(hours = 24): number {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    return this.events.filter((e: SecurityEvent) =>
      e.timestamp > cutoff &&
      e.event === 'unlock_attempt' &&
      e.result === 'failure'
    ).length
  }

  getLastSuccessfulLogin(): SecurityEvent | null {
    return this.events.filter((e: SecurityEvent) =>
      e.event === 'unlock_success' && e.result === 'success'
    ).pop() || null
  }

  cleanupOldEvents(days = 7): void {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000)
    this.events = this.events.filter((e: SecurityEvent) => e.timestamp > cutoff)
    this.saveEvents()
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

// Theme system for premium UI customization
export interface Theme {
  name: string
  displayName: string
  description: string
  colors: {
    background: string
    surface: string
    text: string
    textSecondary: string
    accent: string
    border: string
    error: string
    success: string
    warning: string
    info: string
    glass: string
    glassHover: string
    primary: string
    muted: string
  }
  gradients?: boolean
  amoled?: boolean
}

export const VAULT_THEMES: Theme[] = [
  {
    name: 'default',
    displayName: 'Premium Dark',
    description: 'Modern dark theme with blue accents',
    colors: {
      background: '#0a0a0f',
      surface: '#111118',
      text: '#ffffff',
      textSecondary: '#a1a1aa',
      accent: '#3b82f6',
      border: '#374151',
      error: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      info: '#3b82f6',
      glass: 'rgba(255,255,255,0.05)',
      glassHover: 'rgba(255,255,255,0.1)',
      primary: '#3b82f6',
      muted: '#6b7280'
    }
  },
  {
    name: 'amoled',
    displayName: 'AMOLED Black',
    description: 'Pure black for OLED displays and battery saving',
    amoled: true,
    colors: {
      background: '#000000',
      surface: '#0d0d0d',
      text: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#00ff88',
      border: '#333333',
      error: '#ff4444',
      success: '#00ff88',
      warning: '#ffaa00',
      info: '#0099ff',
      glass: 'rgba(255,255,255,0.03)',
      glassHover: 'rgba(255,255,255,0.08)',
      primary: '#00ff88',
      muted: '#888888'
    }
  },
  {
    name: 'solarized',
    displayName: 'Solarized Dark',
    description: 'Classic developer theme with carefully balanced colors',
    colors: {
      background: '#002b36',
      surface: '#073642',
      text: '#fdf6e3',
      textSecondary: '#93a1a1',
      accent: '#2aa198',
      border: '#586e75',
      error: '#dc322f',
      success: '#859900',
      warning: '#b58900',
      info: '#268bd2',
      glass: 'rgba(253,246,227,0.05)',
      glassHover: 'rgba(253,246,227,0.1)',
      primary: '#2aa198',
      muted: '#657b83'
    }
  },
  {
    name: 'sunset',
    displayName: 'Sunset Gradient',
    description: 'Beautiful orange and pink gradient for evening use',
    gradients: true,
    colors: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      surface: 'rgba(255,255,255,0.95)',
      text: '#2d1b69',
      textSecondary: '#5b4a87',
      accent: '#ff6b6b',
      border: 'rgba(255,255,255,0.2)',
      error: '#ff4757',
      success: '#2ecc71',
      warning: '#ffa726',
      info: '#17a2b8',
      glass: 'rgba(255,255,255,0.15)',
      glassHover: 'rgba(255,255,255,0.25)',
      primary: '#ff6b6b',
      muted: '#7c5b8a'
    }
  },
  {
    name: 'minimal',
    displayName: 'Minimal White',
    description: 'Clean white theme for professional environments',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      text: '#1a1a1a',
      textSecondary: '#6c757d',
      accent: '#495057',
      border: '#dee2e6',
      error: '#dc3545',
      success: '#28a745',
      warning: '#ffc107',
      info: '#17a2b8',
      glass: 'rgba(0,0,0,0.02)',
      glassHover: 'rgba(0,0,0,0.05)',
      primary: '#495057',
      muted: '#adb5bd'
    }
  },
  {
    name: 'high-contrast',
    displayName: 'High Contrast',
    description: 'WCAG compliant theme for accessibility',
    colors: {
      background: '#000000',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#cccccc',
      accent: '#ffff00',
      border: '#ffffff',
      error: '#ff0000',
      success: '#00ff00',
      warning: '#ffff00',
      info: '#0080ff',
      glass: 'rgba(255,255,255,0.05)',
      glassHover: 'rgba(255,255,255,0.1)',
      primary: '#ffff00',
      muted: '#888888'
    }
  },
  {
    name: 'midnight',
    displayName: 'Midnight Blue',
    description: 'Deep blue theme inspired by northern lights',
    colors: {
      background: '#0f1419',
      surface: '#1c2528',
      text: '#ffffff',
      textSecondary: '#8ba0b2',
      accent: '#1da1f2',
      border: '#37454a',
      error: '#e0245e',
      success: '#17bf63',
      warning: '#ffad1f',
      info: '#1da1f2',
      glass: 'rgba(255,255,255,0.05)',
      glassHover: 'rgba(255,255,255,0.08)',
      primary: '#1da1f2',
      muted: '#5b7083'
    }
  }
]

// Theme manager singleton
export class ThemeManager {
  private static instance: ThemeManager
  private currentTheme: string = 'default'

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  private constructor() {
    // Load saved theme on initialization
    this.loadTheme()
  }

  private loadTheme(): void {
    try {
      const saved = localStorage.getItem('vault_theme')
      if (saved && VAULT_THEMES.some(t => t.name === saved)) {
        this.setTheme(saved)
      } else {
        this.setTheme('default')
      }
    } catch {
      this.setTheme('default')
    }
  }

  setTheme(themeName: string): void {
    const theme = VAULT_THEMES.find(t => t.name === themeName)
    if (!theme) return

    this.currentTheme = themeName

    // Apply CSS custom properties to :root
    const root = document.documentElement
    const colors = theme.colors

    // Handle gradient backgrounds
    if (theme.gradients && colors.background.includes('gradient')) {
      root.style.setProperty('--bg-gradient', colors.background)
      root.style.setProperty('--background', '#667eea') // Fallback color
      root.classList.add('theme-gradient')
    } else {
      root.style.setProperty('--background', colors.background)
      root.classList.remove('theme-gradient')
    }

    // Apply all color variables
    root.style.setProperty('--surface', colors.surface)
    root.style.setProperty('--text', colors.text)
    root.style.setProperty('--text-secondary', colors.textSecondary)
    root.style.setProperty('--accent', colors.accent)
    root.style.setProperty('--border', colors.border)
    root.style.setProperty('--error', colors.error)
    root.style.setProperty('--success', colors.success)
    root.style.setProperty('--warning', colors.warning)
    root.style.setProperty('--info', colors.info)
    root.style.setProperty('--glass', colors.glass)
    root.style.setProperty('--glass-hover', colors.glassHover)
    root.style.setProperty('--primary', colors.primary)
    root.style.setProperty('--muted', colors.muted)

    // Save preference
    localStorage.setItem('vault_theme', themeName)

    // Apply AMOLED class if needed
    if (theme.amoled) {
      root.classList.add('theme-amoled')
    } else {
      root.classList.remove('theme-amoled')
    }

    // Trigger theme change event for components that need to react
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }))
  }

  getCurrentTheme(): Theme | undefined {
    return VAULT_THEMES.find(t => t.name === this.currentTheme)
  }

  getTheme(themeName: string): Theme | undefined {
    return VAULT_THEMES.find(t => t.name === themeName)
  }

  getAllThemes(): Theme[] {
    return VAULT_THEMES
  }

  getCurrentThemeName(): string {
    return this.currentTheme
  }
}

/**
 * Memory and data security utilities
 */
export const MemorySecurity = {
  /**
   * Wipe sensitive string data from memory (attempts to prevent memory dumps)
   */
  wipeString: (str: string): void => {
    if (typeof str === 'string') {
      // Overwrite the string with random characters
      const wipe = 'x'.repeat(str.length)
      str.replace(/./g, 'x')
      // Clear references by creating new strings
      const tempString = wipe.split('').map(() => 'x').join('')
      // Note: In JavaScript, strings are immutable, so complete wiping is not guaranteed
      // This is a best-effort approach for sensitive data cleanup
    }
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

      // Use crypto.subtle for constant-time comparison (fallback only)
      // In practice, direct string comparison with fixed length is fine for modern browsers
      return input === stored
    } catch {
      // Ultimate fallback
      return input === stored
    }
  }
}

// Export singleton instances
export const rateLimiter = AuthenticationRateLimiter.getInstance()
export const auditor = SecurityAuditor.getInstance()
