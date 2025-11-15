import type { VaultEntry } from '../vault'

// Smart Autofill Intelligence Engine
export class SmartSuggestions {
  private static instance: SmartSuggestions

  static getInstance(): SmartSuggestions {
    if (!SmartSuggestions.instance) {
      SmartSuggestions.instance = new SmartSuggestions()
    }
    return SmartSuggestions.instance
  }

  // Analyze existing entries to extract patterns
  analyzeEntries(entries: VaultEntry[]) {
    const patterns = {
      emails: new Map<string, number>(),
      usernames: new Map<string, number>(),
      domainPatterns: new Map<string, string[]>(),
      passwordStrengths: new Map<string, number[]>(),
      namePatterns: [] as string[]
    }

    for (const entry of entries) {
      // Extract emails and usernames
      if (entry.username) {
        if (this.isEmail(entry.username)) {
          patterns.emails.set(entry.username, (patterns.emails.get(entry.username) || 0) + 1)
        } else {
          patterns.usernames.set(entry.username, (patterns.usernames.get(entry.username) || 0) + 1)
        }
      }

      // Analyze domain patterns
      if (entry.url && entry.username) {
        try {
          const domain = new URL(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`).hostname
          if (!patterns.domainPatterns.has(domain)) {
            patterns.domainPatterns.set(domain, [])
          }
          if (!patterns.domainPatterns.get(domain)!.includes(entry.username)) {
            patterns.domainPatterns.get(domain)!.push(entry.username)
          }
        } catch {}
      }

      // Analyze password strengths by domain type
      if (entry.url && entry.password) {
        try {
          const domain = new URL(entry.url.startsWith('http') ? entry.url : `https://${entry.url}`).hostname
          if (!patterns.passwordStrengths.has(domain)) {
            patterns.passwordStrengths.set(domain, [])
          }
          patterns.passwordStrengths.get(domain)!.push(this.calculatePasswordStrength(entry.password))
        } catch {}
      }

      // Extract naming patterns for automatic categorization
      if (entry.title && entry.username) {
        const namePart = this.extractNameFromEmail(entry.username)
        if (namePart && !patterns.namePatterns.includes(namePart)) {
          patterns.namePatterns.push(namePart)
        }
      }
    }

    return patterns
  }

  // Get smart suggestions for a given domain and field
  getSuggestions(entries: VaultEntry[], domain: string, field: 'username' | 'email'): string[] {
    const patterns = this.analyzeEntries(entries)
    const suggestions = new Set<string>()

    if (field === 'email') {
      // Suggest common emails with frequency ranking
      const emailArray = Array.from(patterns.emails.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .slice(0, 5)
        .map(([email]) => email)

      emailArray.forEach(email => suggestions.add(email))

      // Add domain-specific emails
      const domainEmails = patterns.domainPatterns.get(domain) || []
      domainEmails.forEach(email => suggestions.add(email))
    }

    // Generate smart email suggestions based on existing patterns
    const namePatterns = patterns.namePatterns
    if (namePatterns.length > 0) {
      const domainBase = domain.split('.')[0] // Get domain name without TLD
      namePatterns.slice(0, 3).forEach(name => {
        // Common email patterns
        const patterns = [
          `${name}@${domain}`,
          `${name}.${domainBase}@gmail.com`,
          `${name}${domainBase}@gmail.com`,
          `${domainBase}.${name}@gmail.com`
        ]
        patterns.forEach(pattern => suggestions.add(pattern))
      })
    }

    return Array.from(suggestions).slice(0, 8) // Limit to 8 suggestions
  }

  // Get recommended password config for domain
  getRecommendedPasswordConfig(entries: VaultEntry[], domain: string) {
    const patterns = this.analyzeEntries(entries)
    const strengths = patterns.passwordStrengths.get(domain) || []

    if (strengths.length === 0) {
      // Default recommendations based on domain type
      return this.getDomainTypeRecommendation(domain)
    }

    // Return average strength recommendation
    const avgStrength = strengths.reduce((a, b) => a + b, 0) / strengths.length
    return this.strengthToConfig(avgStrength)
  }

  // Detect if text is an email
  private isEmail(text: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
  }

  // Extract name from email (john.doe@gmail.com -> john.doe)
  private extractNameFromEmail(email: string): string | null {
    if (!this.isEmail(email)) return null
    return email.split('@')[0]
  }

  // Calculate basic password strength score
  private calculatePasswordStrength(password: string): number {
    let score = 0

    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1

    if (/[a-z]/.test(password)) score += 0.5
    if (/[A-Z]/.test(password)) score += 0.5
    if (/[0-9]/.test(password)) score += 0.5
    if (/[^A-Za-z0-9]/.test(password)) score += 0.5

    return Math.min(score, 5) // Max score of 5
  }

  // Get recommendations based on domain type
  private getDomainTypeRecommendation(domain: string): any {
    // Banking and financial - highest security
    if (this.isBankingDomain(domain)) {
      return {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        avoidAmbiguous: true
      }
    }

    // Work/business - high security
    if (this.isWorkDomain(domain) || this.isDeveloperDomain(domain)) {
      return {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        avoidAmbiguous: false
      }
    }

    // Social media - medium security
    if (this.isSocialDomain(domain)) {
      return {
        length: 14,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
        avoidAmbiguous: false
      }
    }

    // Default - good general security
    return {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      avoidAmbiguous: false
    }
  }

  // Convert strength score to password config
  private strengthToConfig(strength: number) {
    const baseConfig = {
      length: 12,
      includeUppercase: strength >= 2,
      includeLowercase: strength >= 1,
      includeNumbers: strength >= 3,
      includeSymbols: strength >= 4,
      avoidAmbiguous: strength >= 4
    }

    // Scale length with strength
    if (strength >= 4) baseConfig.length = 20
    else if (strength >= 3) baseConfig.length = 16
    else if (strength >= 2) baseConfig.length = 14

    return baseConfig
  }

  // Domain categorization helpers
  private isBankingDomain(domain: string): boolean {
    const bankingKeywords = ['bank', 'banking', 'icici', 'hdfc', 'sbi', 'axis', 'paytm', 'phonepe', 'stripe']
    return bankingKeywords.some(keyword => domain.includes(keyword))
  }

  private isWorkDomain(domain: string): boolean {
    const workKeywords = ['gmail', 'outlook', 'office365', 'slack', 'teams']
    return workKeywords.some(keyword => domain.includes(keyword))
  }

  private isSocialDomain(domain: string): boolean {
    const socialKeywords = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
    return socialKeywords.some(keyword => domain.includes(keyword))
  }

  private isDeveloperDomain(domain: string): boolean {
    const devKeywords = ['github', 'gitlab', 'bitbucket', 'stackoverflow', 'npm', 'vercel']
    return devKeywords.some(keyword => domain.includes(keyword))
  }

  // Smart title suggestions based on URL
  getSuggestedTitle(url: string, currentTitle: string): string[] {
    const suggestions: string[] = []

    if (!url) return suggestions

    try {
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
      const domainBase = domain.split('.')[0]

      // Common service name variations
      const variations = [
        domainBase.charAt(0).toUpperCase() + domainBase.slice(1), // Capitalized
        domainBase.toUpperCase(), // All caps
        `${domainBase.charAt(0).toUpperCase() + domainBase.slice(1)} Account`,
        `${domainBase.charAt(0).toUpperCase() + domainBase.slice(1)} Login`
      ]

      suggestions.push(...variations.filter(v => v !== currentTitle))

      // Add service-specific common names
      const serviceNames: { [key: string]: string[] } = {
        'gmail': ['Google Mail', 'Gmail Account', 'Google Account'],
        'github': ['GitHub', 'GitHub Account', 'Code Repository'],
        'slack': ['Slack Workspace', 'Team Chat'],
        'facebook': ['Facebook', 'Social Media'],
        'amazon': ['Amazon', 'Online Shopping', 'E-commerce']
      }

      if (serviceNames[domainBase]) {
        suggestions.push(...serviceNames[domainBase])
      }

    } catch {}

    return suggestions.slice(0, 5)
  }
}

// Export singleton instance
export const smartSuggestions = SmartSuggestions.getInstance()
