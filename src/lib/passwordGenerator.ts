import zxcvbn from 'zxcvbn'

export interface PasswordConfig {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
}

export interface PasswordStrength {
  score: number // 0-4 (weak to very strong)
  crackTimeDisplay: string | number
  feedback: {
    warning?: string
    suggestions: string[]
  }
  guesses: number | string // zxcvbn returns number or formatted string
}

// Default configuration
export const DEFAULT_CONFIG: PasswordConfig = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false,
  excludeAmbiguous: true
}

// Character sets
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?'

const AMBIGUOUS = 'l1Io0OcCdDBg69'

/**
 * Generate a secure random password
 */
export function generatePassword(config: PasswordConfig = DEFAULT_CONFIG): string {
  const { length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeAmbiguous } = config

  // Build character set based on config
  let charset = ''
  if (includeLowercase) charset += LOWERCASE
  if (includeUppercase) charset += UPPERCASE
  if (includeNumbers) charset += NUMBERS
  if (includeSymbols) charset += SYMBOLS

  // Remove ambiguous characters if requested
  if (excludeAmbiguous) {
    charset = charset.split('').filter(char => !AMBIGUOUS.includes(char)).join('')
  }

  if (!charset) {
    throw new Error('No character types selected')
  }

  // Ensure we have at least one character from each selected type
  const requiredChars: string[] = []
  if (includeLowercase) requiredChars.push(getRandomChar(LOWERCASE, excludeAmbiguous))
  if (includeUppercase) requiredChars.push(getRandomChar(UPPERCASE, excludeAmbiguous))
  if (includeNumbers) requiredChars.push(getRandomChar(NUMBERS, false)) // Numbers don't have ambiguous chars we care about
  if (includeSymbols) requiredChars.push(getRandomChar(SYMBOLS, false))

  // Fill remaining length with random characters from full charset
  const remainingLength = Math.max(0, length - requiredChars.length)
  let password = requiredChars.join('')

  for (let i = 0; i < remainingLength; i++) {
    password += getRandomChar(charset, false)
  }

  // Shuffle the password to avoid predictable patterns
  return shuffleString(password)
}

/**
 * Get random character from charset
 */
function getRandomChar(charset: string, excludeAmbiguous: boolean): string {
  let availableChars = charset
  if (excludeAmbiguous) {
    availableChars = charset.split('').filter(char => !AMBIGUOUS.includes(char)).join('')
  }

  if (!availableChars) {
    // Fallback to original charset if filtering removed everything
    availableChars = charset
  }

  const randomIndex = crypto.getRandomValues(new Uint32Array(1))[0] % availableChars.length
  return availableChars[randomIndex]
}

/**
 * Shuffle a string using Fisher-Yates algorithm
 */
function shuffleString(str: string): string {
  const array = str.split('')
  for (let i = array.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array.join('')
}

/**
 * Analyze password strength using zxcvbn
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  const result = zxcvbn(password)

  return {
    score: result.score,
    crackTimeDisplay: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    feedback: {
      warning: result.feedback.warning || undefined,
      suggestions: result.feedback.suggestions || []
    },
    guesses: result.guesses
  }
}

/**
 * Generate a pronounceable password (readable word-like)
 */
export function generatePronounceablePassword(length: number = 12): string {
  const vowels = 'aeiou'
  const consonants = 'bcdfghjklmnpqrstvwxyz'

  let password = ''
  let isVowel = Math.random() < 0.5

  for (let i = 0; i < length; i++) {
    const chars = isVowel ? vowels : consonants
    password += getRandomChar(chars, true) // Exclude ambiguous
    isVowel = !isVowel
  }

  // Add some numbers/symbols for strength but keep readable
  const specials = NUMBERS + '!'
  const insertPos = Math.floor(Math.random() * (password.length - 1)) + 1
  password = password.slice(0, insertPos) + getRandomChar(specials, false) + password.slice(insertPos)

  return password
}

/**
 * Get strength score as human-readable text
 */
export function getStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Very Weak'
    case 1: return 'Weak'
    case 2: return 'Fair'
    case 3: return 'Good'
    case 4: return 'Very Strong'
    default: return 'Unknown'
  }
}

/**
 * Get color class for strength indicator
 */
export function getStrengthColorClass(score: number): string {
  switch (score) {
    case 0: return 'bg-red-500'
    case 1: return 'bg-orange-500'
    case 2: return 'bg-yellow-500'
    case 3: return 'bg-blue-500'
    case 4: return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}
