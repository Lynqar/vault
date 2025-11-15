import zxcvbn from 'zxcvbn'
import type { VaultEntry } from '../vault'

// Common breached passwords database (first 100 from HaveIBeenPwned)
// In production, you'd use a much larger dataset or API
const COMMON_BREACHED_PASSWORDS = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'iloveyou', 'princess',
  'rockyou', '1234567', '12345678', 'sunshine', 'qwerty123', 'qwertyuiop',
  'football', 'baseball', 'trustno1', 'superman', 'michael', 'jennifer'
])

export interface PasswordAuditResult {
  entry: VaultEntry
  score: number // Overall security score 0-100
  strength: {
    score: number // zxcvbn score 0-4
    crackTime: string | number
    warnings: string[]
    suggestions: string[]
  }
  risks: {
    breached: boolean
    reused: boolean
    weak: boolean
    old: boolean
    easyPattern: boolean
    noSpecialChars: boolean
    short: boolean
  }
  recommendations: PasswordRecommendation[]
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'secure'
}

export interface PasswordRecommendation {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  action: 'change' | 'strengthen' | 'review' | 'monitor'
  estimatedImpact: 'high' | 'medium' | 'low'
}

export interface AuditReport {
  totalEntries: number
  secureEntries: number
  riskSummary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  recentBreachIncidents: number
  passwordReuseCount: number
  averagePasswordAge: number
  overallSecurityScore: number
  topRecommendations: PasswordRecommendation[]
}

export class PasswordAuditor {
  private static instance: PasswordAuditor

  static getInstance(): PasswordAuditor {
    if (!PasswordAuditor.instance) {
      PasswordAuditor.instance = new PasswordAuditor()
    }
    return PasswordAuditor.instance
  }

  // Comprehensive password analysis
  auditEntry(entry: VaultEntry, allEntries: VaultEntry[]): PasswordAuditResult {
    const password = entry.password || ''

    // Basic strength analysis using zxcvbn
    const strengthResult = zxcvbn(password)

    // Risk assessment
    const risks = this.analyzeRisks(password, entry, allEntries, strengthResult)

    // Calculate overall score
    const score = this.calculateSecurityScore(strengthResult.score, risks)

    // Generate recommendations
    const recommendations = this.generateRecommendations(entry, risks, strengthResult)

    // Determine risk level
    const riskLevel = this.determineRiskLevel(score, risks)

    return {
      entry,
      score,
      strength: {
        score: strengthResult.score,
        crackTime: strengthResult.crack_times_display.offline_slow_hashing_1e4_per_second,
        warnings: strengthResult.feedback.warning ? [strengthResult.feedback.warning] : [],
        suggestions: strengthResult.feedback.suggestions || []
      },
      risks,
      recommendations,
      riskLevel
    }
  }

  // Analyze various risk factors
  private analyzeRisks(password: string, entry: VaultEntry, allEntries: VaultEntry[], strength: any) {
    return {
      breached: this.isBreachedPassword(password),
      reused: this.isPasswordReused(password, allEntries, entry.id),
      weak: strength.score < 2,
      old: this.isPasswordOld(entry),
      easyPattern: this.hasEasyPatterns(password),
      noSpecialChars: !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      short: password.length < 12
    }
  }

  // Check if password appears in breach databases
  private isBreachedPassword(password: string): boolean {
    // Convert to lowercase for case-insensitive matching
    const lowerPassword = password.toLowerCase()
    return COMMON_BREACHED_PASSWORDS.has(lowerPassword) ||
           // Check for common variations
           this.isCommonVariation(password)
  }

  // Check for common password variations
  private isCommonVariation(password: string): boolean {
    const variations = [
      password + '123',
      'password' + password,
      password + '!',
      password + '2023',
      password + '2024',
      password + '2025'
    ]
    return variations.some(v => COMMON_BREACHED_PASSWORDS.has(v.toLowerCase()))
  }

  // Check if password is reused across entries
  private isPasswordReused(password: string, allEntries: VaultEntry[], currentEntryId?: string): boolean {
    const reuseCount = allEntries.filter(entry =>
      entry.id !== currentEntryId &&
      entry.password === password
    ).length
    return reuseCount > 0
  }

  // Check if password is considered old (should change periodically)
  private isPasswordOld(entry: VaultEntry): boolean {
    const lastModified = entry.updatedAt || entry.createdAt
    if (!lastModified) return false
    const passwordAge = Date.now() - new Date(lastModified).getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000

    // Banking and critical accounts should change every 90 days
    if (this.isCriticalAccount(entry)) {
      const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000
      return passwordAge > ninetyDaysMs
    }

    // Regular accounts every 6 months
    const sixMonthsMs = 183 * 24 * 60 * 60 * 1000
    return passwordAge > sixMonthsMs
  }

  // Check if account is critical (banking, email, work)
  private isCriticalAccount(entry: VaultEntry): boolean {
    const title = (entry.title || '').toLowerCase()
    const url = (entry.url || '').toLowerCase()
    const criticalKeywords = ['bank', 'email', 'gmail', 'outlook', 'work', 'office', 'login']

    return criticalKeywords.some(keyword =>
      title.includes(keyword) || url.includes(keyword)
    )
  }

  // Detect easy patterns in passwords
  private hasEasyPatterns(password: string): boolean {
    // Keyboard patterns
    const keyboardPatterns = [
      'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
      'qazwsx', 'wsxedc', 'qazxsw', 'zxcasd'
    ]

    // Number sequences
    const numberPatterns = [
      '123456', '654321', '111111', '222222', '333333',
      '012345', '987654', '000000'
    ]

    // Date patterns
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString())

    const lowerPassword = password.toLowerCase()

    return keyboardPatterns.some(pattern => lowerPassword.includes(pattern)) ||
           numberPatterns.some(pattern => lowerPassword.includes(pattern)) ||
           years.some(year => lowerPassword.includes(year))
  }

  // Calculate overall security score
  private calculateSecurityScore(strengthScore: number, risks: any): number {
    let score = (strengthScore / 4) * 100 // Base score from zxcvbn

    // Apply risk penalties
    if (risks.breached) score -= 80
    else if (risks.reused) score -= 60
    else if (risks.weak) score -= 40
    else if (risks.old) score -= 20
    else if (risks.easyPattern || risks.noSpecialChars || risks.short) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  // Generate personalized recommendations
  private generateRecommendations(entry: VaultEntry, risks: any, strength: any): PasswordRecommendation[] {
    const recommendations: PasswordRecommendation[] = []

    if (risks.breached) {
      recommendations.push({
        id: 'breached-password',
        priority: 'critical',
        title: 'Immediate Password Change Required',
        description: 'This password has been found in known data breaches. Change immediately to protect your account.',
        action: 'change',
        estimatedImpact: 'high'
      })
    }

    if (risks.reused) {
      recommendations.push({
        id: 'password-reuse',
        priority: 'high',
        title: 'Password Reuse Detected',
        description: 'This password is used for multiple accounts. Use unique passwords for each service.',
        action: 'change',
        estimatedImpact: 'high'
      })
    }

    if (risks.weak && !risks.breached) {
      recommendations.push({
        id: 'weak-password',
        priority: 'high',
        title: 'Improve Password Strength',
        description: `Estimated crack time: ${strength.crack_times_display.offline_slow_hashing_1e4_per_second}. Consider using a longer, more complex password.`,
        action: 'strengthen',
        estimatedImpact: 'high'
      })
    }

    if (risks.old) {
      recommendations.push({
        id: 'old-password',
        priority: 'medium',
        title: 'Password Age Concern',
        description: `${this.isCriticalAccount(entry) ? 'Critical' : 'Regular'} accounts should update passwords periodically.`,
        action: 'change',
        estimatedImpact: 'medium'
      })
    }

    if (risks.easyPattern || risks.noSpecialChars) {
      recommendations.push({
        id: 'pattern-improvement',
        priority: 'medium',
        title: 'Enhance Password Complexity',
        description: 'Add special characters and avoid common patterns (keyboard, numbers, dates).',
        action: 'strengthen',
        estimatedImpact: 'medium'
      })
    }

    if (risks.short) {
      recommendations.push({
        id: 'length-improvement',
        priority: 'low',
        title: 'Increase Password Length',
        description: 'Aim for at least 12 characters for better security.',
        action: 'strengthen',
        estimatedImpact: 'medium'
      })
    }

    if (recommendations.length === 0 && strength.score === 4) {
      recommendations.push({
        id: 'excellent-security',
        priority: 'low',
        title: 'Excellent Security',
        description: 'This password meets highest security standards. Consider regular monitoring.',
        action: 'monitor',
        estimatedImpact: 'low'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  // Determine overall risk level
  private determineRiskLevel(score: number, risks: any): PasswordAuditResult['riskLevel'] {
    if (risks.breached || score < 20) return 'critical'
    if (risks.reused || risks.weak || score < 40) return 'high'
    if (score < 60) return 'medium'
    if (score < 80) return 'low'
    return 'secure'
  }

  // Generate comprehensive security report
  generateReport(entries: VaultEntry[]): AuditReport {
    const auditResults = entries.map(entry => this.auditEntry(entry, entries))

    const riskSummary = auditResults.reduce((acc, result) => {
      acc[result.riskLevel] = (acc[result.riskLevel] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const secureEntries = auditResults.filter(r => r.riskLevel === 'secure').length
    const breachedIncidents = auditResults.filter(r => r.risks.breached).length
    const reuseCount = auditResults.filter(r => r.risks.reused).length

    // Calculate average password age
    const entriesWithDates = entries.filter(e => e.updatedAt || e.createdAt)
    const avgAge = entriesWithDates.length > 0
      ? entriesWithDates.reduce((sum, e) => {
          const lastModified = e.updatedAt || e.createdAt
          return sum + (Date.now() - new Date(lastModified!).getTime())
        }, 0) / entriesWithDates.length
      : 0

    const overallScore = auditResults.reduce((sum, r) => sum + r.score, 0) / auditResults.length

    // Collect top recommendations
    const allRecommendations = auditResults.flatMap(r => r.recommendations)
    const uniqueRecommendations = allRecommendations.filter((rec, index) =>
      allRecommendations.findIndex(r => r.id === rec.id) === index
    ).slice(0, 10)

    return {
      totalEntries: entries.length,
      secureEntries,
      riskSummary: {
        critical: riskSummary.critical || 0,
        high: riskSummary.high || 0,
        medium: riskSummary.medium || 0,
        low: riskSummary.low || 0
      },
      recentBreachIncidents: breachedIncidents,
      passwordReuseCount: reuseCount,
      averagePasswordAge: avgAge / (1000 * 60 * 60 * 24), // Convert to days
      overallSecurityScore: overallScore,
      topRecommendations: uniqueRecommendations
    }
  }

  // Generate security tips
  getSecurityTips(): string[] {
    return [
      "Use unique passwords for every account - avoid reuse",
      "Aim for passwords with 12+ characters using mixed case, numbers, and symbols",
      "Change passwords regularly for critical accounts (every 90 days)",
      "Avoid common patterns like keyboard sequences or personal information",
      "Use a password manager to generate and store secure passwords",
      "Enable two-factor authentication (2FA) wherever possible",
      "Regularly monitor for data breaches affecting your accounts",
      "Use passphrases for better memorability and security"
    ]
  }
}

// Export singleton instance
export const passwordAuditor = PasswordAuditor.getInstance()
