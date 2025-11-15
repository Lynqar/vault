import { passwordAuditor, type AuditReport, type PasswordAuditResult } from './passwordAuditor'
import type { VaultEntry } from '../vault'

// Security score weights (total = 100)
export interface SecurityScoreWeights {
  passwordStrength: number    // 35 points - strength of individual passwords
  passwordUniqueness: number  // 25 points - no password reuse
  mfaEnabled: number         // 20 points - TOTP/multi-factor auth
  backupEnabled: number      // 10 points - regular backups
  recentActivity: number     // 10 points - regular password updates
  criticalSecurity: number   // Bonus multiplier for critical accounts
}

export const DEFAULT_WEIGHTS: SecurityScoreWeights = {
  passwordStrength: 35,
  passwordUniqueness: 25,
  mfaEnabled: 20,
  backupEnabled: 10,
  recentActivity: 10,
  criticalSecurity: 0 // This is a multiplier
}

// Achievement badges
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: Date
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  progress?: { current: number; target: number }
}

export interface SecurityScore {
  totalScore: number
  breakdown: {
    passwordStrength: number
    passwordUniqueness: number
    mfaEnabled: number
    backupEnabled: number
    recentActivity: number
  }
  bonuses: {
    criticalSecurity: number
    achievements: number
  }
  achievements: Achievement[]
  level: {
    current: number
    title: string
    progressToNext: number
  }
  recommendations: string[]
}

export class SecurityScorer {
  private static instance: SecurityScorer

  static getInstance(): SecurityScorer {
    if (!SecurityScorer.instance) {
      SecurityScorer.instance = new SecurityScorer()
    }
    return SecurityScorer.instance
  }

  // Calculate comprehensive security score
  calculateScore(entries: VaultEntry[]): SecurityScore {
    const auditReport = this.getAuditReport(entries)

    // Calculate component scores
    const passwordStrengthScore = this.calculatePasswordStrengthScore(entries, auditReport)
    const passwordUniquenessScore = this.calculatePasswordUniquenessScore(entries, auditReport)
    const mfaScore = this.calculateMFAScore(entries)
    const backupScore = this.calculateBackupScore(entries)
    const activityScore = this.calculateActivityScore(entries)

    // Calculate base score
    const baseScore = (
      (passwordStrengthScore * DEFAULT_WEIGHTS.passwordStrength / 100) +
      (passwordUniquenessScore * DEFAULT_WEIGHTS.passwordUniqueness / 100) +
      (mfaScore * DEFAULT_WEIGHTS.mfaEnabled / 100) +
      (backupScore * DEFAULT_WEIGHTS.backupEnabled / 100) +
      (activityScore * DEFAULT_WEIGHTS.recentActivity / 100)
    )

    // Apply critical security bonus multiplier
    const criticalBonus = this.calculateCriticalSecurityBonus(entries)
    const achievementBonus = this.calculateAchievementBonus()

    // Cap at 100
    const totalScore = Math.min(100, baseScore * criticalBonus + achievementBonus)

    return {
      totalScore: Math.round(totalScore),
      breakdown: {
        passwordStrength: Math.round(passwordStrengthScore),
        passwordUniqueness: Math.round(passwordUniquenessScore),
        mfaEnabled: Math.round(mfaScore),
        backupEnabled: Math.round(backupScore),
        recentActivity: Math.round(activityScore)
      },
      bonuses: {
        criticalSecurity: Math.round((criticalBonus - 1) * 100),
        achievements: Math.round(achievementBonus)
      },
      achievements: this.getAchievements(entries, auditReport),
      level: this.calculateLevel(totalScore),
      recommendations: this.generateRecommendations(entries, auditReport)
    }
  }

  private calculatePasswordStrengthScore(entries: VaultEntry[], report: AuditReport): number {
    if (entries.length === 0) return 0

    let totalStrengthScore = 0

    entries.forEach(entry => {
      const audit = passwordAuditor.auditEntry(entry, entries)
      // Convert zxcvbn score (0-4) to percentage (0-100)
      const normalizedScore = (audit.strength.score / 4) * 100
      totalStrengthScore += normalizedScore
    })

    return totalStrengthScore / entries.length
  }

  private calculatePasswordUniquenessScore(entries: VaultEntry[], report: AuditReport): number {
    if (entries.length === 0) return 100

    const uniquePasswords = new Set(entries.map(e => e.password)).size
    const uniquenessRatio = uniquePasswords / entries.length

    return uniquenessRatio * 100
  }

  private calculateMFAScore(entries: VaultEntry[]): number {
    if (entries.length === 0) return 0

    const mfaEnabledEntries = entries.filter(e => e.totpSecret && e.totpSecret.trim()).length
    return (mfaEnabledEntries / entries.length) * 100
  }

  private calculateBackupScore(entries: VaultEntry[]): number {
    // Check if backups exist (simulate for now - would check backup service)
    // For demo, we'll consider score based on vault age vs critical accounts
    const backupExists = localStorage.getItem('last_backup') !== null
    const daysSinceBackup = backupExists ?
      (Date.now() - new Date(localStorage.getItem('last_backup')!).getTime()) / (1000 * 60 * 60 * 24) :
      365

    // Score decreases as time since backup increases
    const backupFreshness = Math.max(0, 100 - (daysSinceBackup / 30) * 20)
    return backupExists ? Math.min(100, backupFreshness) : 0
  }

  private calculateActivityScore(entries: VaultEntry[]): number {
    if (entries.length === 0) return 0

    const now = Date.now()
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000)

    let recentUpdates = 0
    let totalCritical = 0

    entries.forEach(entry => {
      const isCritical = this.isCriticalAccount(entry)
      if (isCritical) totalCritical++

      const lastModified = entry.updatedAt || entry.createdAt
      if (lastModified) {
        const modifiedTime = new Date(lastModified).getTime()
        if (isCritical) {
          // Critical accounts should be updated within 90 days
          if (modifiedTime > ninetyDaysAgo) recentUpdates++
        } else {
          // Regular accounts within 30 days
          if (modifiedTime > thirtyDaysAgo) recentUpdates++
        }
      }
    })

    return totalCritical > 0 ? (recentUpdates / entries.length) * 100 : 50
  }

  private calculateCriticalSecurityBonus(entries: VaultEntry[]): number {
    // Bonus multiplier for well-protected critical accounts
    const criticalEntries = entries.filter(e => this.isCriticalAccount(e))
    if (criticalEntries.length === 0) return 1.0

    const wellProtected = criticalEntries.filter(e => {
      const audit = passwordAuditor.auditEntry(e, entries)
      return e.totpSecret && audit.riskLevel === 'secure' && audit.strength.score >= 3
    }).length

    // Bonus up to 1.25x for excellent critical account protection
    const protectionRatio = wellProtected / criticalEntries.length
    return 1.0 + (protectionRatio * 0.25)
  }

  private calculateAchievementBonus(): number {
    // Achievement-based bonus points
    const achievements = this.getUserAchievements()
    const unlockedAchievements = achievements.filter(a => a.unlocked).length
    return unlockedAchievements * 2 // 2 points per achievement
  }

  private getAchievements(entries: VaultEntry[], report: AuditReport): Achievement[] {
    return [
      {
        id: 'first-entry',
        name: 'Getting Started',
        description: 'Added your first password entry',
        icon: '🎯',
        rarity: 'common' as const,
        unlocked: entries.length >= 1
      },
      {
        id: 'secure-master',
        name: 'Security Master',
        description: 'Achieved 90+ security score',
        icon: '👑',
        rarity: 'epic' as const,
        unlocked: report.overallSecurityScore >= 90,
        progress: { current: report.overallSecurityScore, target: 90 }
      },
      {
        id: 'mfa-champion',
        name: '2FA Champion',
        description: 'Enabled MFA on all accounts',
        icon: '🛡️',
        rarity: 'rare' as const,
        unlocked: entries.filter(e => e.totpSecret).length === entries.length && entries.length >= 3
      },
      {
        id: 'unique-passwords',
        name: 'Unique Guardian',
        description: 'No password reuse across accounts',
        icon: '🔑',
        rarity: 'epic' as const,
        unlocked: report.passwordReuseCount === 0 && entries.length >= 3
      },
      {
        id: 'breach-survivor',
        name: 'Breach Survivor',
        description: 'Audited and fixed compromised passwords',
        icon: '🚨',
        rarity: 'legendary' as const,
        unlocked: report.recentBreachIncidents === 0 && entries.length >= 5
      },
      {
        id: 'backup-hero',
        name: 'Backup Hero',
        description: 'Regularly backup your vault',
        icon: '💾',
        rarity: 'common' as const,
        unlocked: localStorage.getItem('last_backup') !== null
      },
      {
        id: 'twenty-accounts',
        name: 'Power User',
        description: 'Manage 20+ password entries',
        icon: '🚀',
        rarity: 'rare' as const,
        unlocked: entries.length >= 20,
        progress: { current: entries.length, target: 20 }
      }
    ].map(achievement => ({
      ...achievement,
      unlockedAt: achievement.unlocked ?
        new Date(localStorage.getItem(`achievement_${achievement.id}`) || Date.now()) :
        undefined
    }))
  }

  private calculateLevel(totalScore: number): SecurityScore['level'] {
    const levels = [
      { min: 0, max: 19, title: 'Security Novice', emoji: '🌱' },
      { min: 20, max: 39, title: 'Getting Safer', emoji: '🌿' },
      { min: 40, max: 59, title: 'Security Aware', emoji: '🌳' },
      { min: 60, max: 79, title: 'Well Protected', emoji: '🛡️' },
      { min: 80, max: 89, title: 'Security Expert', emoji: '⚔️' },
      { min: 90, max: 100, title: 'Digital Fortress', emoji: '🏰' }
    ]

    const currentLevel = levels.find(level => totalScore >= level.min && totalScore <= level.max) || levels[0]
    const levelIndex = levels.indexOf(currentLevel)
    const progressToNext = levelIndex < levels.length - 1 ?
      ((totalScore - currentLevel.min) / (levels[levelIndex + 1].max - currentLevel.min)) * 100 :
      100

    return {
      current: levelIndex + 1,
      title: `${currentLevel.emoji} ${currentLevel.title}`,
      progressToNext: Math.round(progressToNext)
    }
  }

  private generateRecommendations(entries: VaultEntry[], report: AuditReport): string[] {
    const recommendations: string[] = []

    if (report.riskSummary.critical > 0) {
      recommendations.push("🚨 Immediate action required: Fix critical security issues")
    }

    if (report.passwordReuseCount > 0) {
      recommendations.push("🔑 Change reused passwords to unique ones")
    }

    if (entries.filter(e => !e.totpSecret).length > 0) {
      recommendations.push("🛡️ Enable 2FA on accounts that support it")
    }

    if (report.overallSecurityScore < 70) {
      recommendations.push("⚡ Generate stronger passwords for weak entries")
    }

    if (!localStorage.getItem('last_backup')) {
      recommendations.push("💾 Create your first vault backup")
    }

    return recommendations.slice(0, 3) // Limit to top 3
  }

  private isCriticalAccount(entry: VaultEntry): boolean {
    const title = (entry.title || '').toLowerCase()
    const url = (entry.url || '').toLowerCase()
    const criticalKeywords = ['bank', 'banking', 'email', 'gmail', 'outlook', 'work', 'office', 'finance', 'wallet']

    return criticalKeywords.some(keyword =>
      title.includes(keyword) || url.includes(keyword)
    )
  }

  private getUserAchievements(): Achievement[] {
    try {
      const stored = localStorage.getItem('user_achievements')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  private getAuditReport(entries: VaultEntry[]): AuditReport {
    return passwordAuditor.generateReport(entries)
  }

  // Save achievement progress
  saveAchievementProgress(): void {
    // This would be called after achievements are unlocked
    const achievements = this.getAchievements([], this.getAuditReport([]))
    achievements.forEach(achievement => {
      if (achievement.unlocked && !localStorage.getItem(`achievement_${achievement.id}`)) {
        localStorage.setItem(`achievement_${achievement.id}`, new Date().toISOString())
      }
    })
  }

  // Get security tips based on current score
  getPersonalizedTips(entries: VaultEntry[]): string[] {
    const score = this.calculateScore(entries)
    const tips: string[] = []

    if (score.breakdown.passwordStrength < 70) {
      tips.push("Your password strength needs improvement. Use longer phrases with mixed characters.")
    }

    if (score.breakdown.mfaEnabled < 50) {
      tips.push("Enable 2-factor authentication on your most important accounts first.")
    }

    if (score.breakdown.passwordUniqueness < 80) {
      tips.push("Avoid reusing passwords. Each account should have a unique password.")
    }

    return tips
  }
}

// Export singleton instance
export const securityScorer = SecurityScorer.getInstance()
