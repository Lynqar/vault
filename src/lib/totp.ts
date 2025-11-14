import { authenticator } from 'otplib'

export interface TOTPConfig {
  secret: string
  label?: string
  issuer?: string
}

export interface TOTPResult {
  token: string
  remaining: number // seconds until next change
  period: number // how often token changes
}

/**
 * Generate a new TOTP secret
 */
export function generateTOTPSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Generate TOTP token from secret
 */
export function generateTOTPToken(secret: string): TOTPResult {
  try {
    const token = authenticator.generate(secret)
    const remaining = 30 - (Math.floor(Date.now() / 1000) % 30) // Standard 30 second window
    const period = 30 // Standard 30 second period

    return {
      token,
      remaining,
      period
    }
  } catch (error) {
    throw new Error('Invalid TOTP secret')
  }
}

/**
 * Verify a TOTP token
 */
export function verifyTOTPToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    return false
  }
}

/**
 * Generate backup codes (for emergency access)
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric backup codes
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map(n => String.fromCharCode(65 + (n % 26))) // A-Z
      .join('')
    codes.push(code)
  }
  return codes
}

/**
 * Format remaining time as MM:SS
 */
export function formatTOTPTime(remaining: number): string {
  return `${remaining}s`
}

/**
 * Get progress percentage (0-100) for TOTP countdown
 */
export function getTOTPProgress(remaining: number, total: number = 30): number {
  return (remaining / total) * 100
}

/**
 * Parse TOTP URL (otpauth:// format)
 */
export function parseTOTPUrl(url: string): TOTPConfig | null {
  try {
    const authUrl = new URL(url)
    if (authUrl.protocol !== 'otpauth:') return null

    const secret = authUrl.searchParams.get('secret')
    if (!secret) return null

    const label = authUrl.pathname.slice(1) // Remove leading /
    const issuer = authUrl.searchParams.get('issuer')

    return {
      secret,
      label,
      issuer: issuer || undefined
    }
  } catch (error) {
    return null
  }
}

/**
 * Create TOTP URL (otpauth:// format)
 */
export function createTOTPUrl(config: TOTPConfig): string {
  const url = new URL('otpauth://totp/' + encodeURIComponent(config.label || 'Unknown'))
  url.searchParams.set('secret', config.secret)
  if (config.issuer) {
    url.searchParams.set('issuer', config.issuer)
  }
  url.searchParams.set('algorithm', 'SHA1')
  url.searchParams.set('digits', '6')
  url.searchParams.set('period', '30')

  return url.toString()
}

/**
 * Validate TOTP secret format
 */
export function isValidTOTPSecret(secret: string): boolean {
  // TOTP secrets should be base32 alphanumeric, typically 32 chars
  const base32Regex = /^[A-Z2-7]+=*$/i
  return base32Regex.test(secret) && secret.length >= 16
}
