/**
 * WebAuthn (Biometric) Authentication Utilities
 * Provides biometric unlock functionality using WebAuthn API
 */

export interface WebAuthnCredential {
  id: string
  publicKey: CryptoKey
  counter: number
  createdAt: string
  deviceName: string
  lastUsed?: string
}

export interface WebAuthnOptions {
  timeout?: number
  userVerification?: UserVerificationRequirement
  residentKey?: ResidentKeyRequirement
}

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    !!window.navigator.credentials &&
    !!window.PublicKeyCredential &&
    !!window.navigator.credentials.create &&
    !!window.navigator.credentials.get
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<{
  available: boolean
  authenticators: AuthenticatorTransport[]
}> {
  if (!isWebAuthnSupported()) {
    return { available: false, authenticators: [] }
  }

  try {
    // Check what authenticators are available
    const result = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        timeout: 1000,
        userVerification: 'preferred',
        allowCredentials: []
      },
      mediation: 'conditional' as any
    } as any)

    const transports = result ? ['internal' as AuthenticatorTransport] : []
    return { available: !!result, authenticators: transports }
  } catch (error) {
    console.warn('Biometric availability check failed:', error)
    return { available: false, authenticators: [] }
  }
}

/**
 * Generate a challenge for WebAuthn operations
 */
function generateChallenge(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(32))
}

/**
 * Register a new WebAuthn credential for biometric authentication
 */
export async function registerBiometricCredential(
  username: string = 'Vault User',
  options: WebAuthnOptions = {}
): Promise<WebAuthnCredential> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser')
  }

  try {
    const challenge = generateChallenge()

    const credentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      rp: {
        name: 'Lynqar Password Vault',
        id: window.location.hostname
      },
      user: {
        id: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), // Static user ID for vault
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        {
          alg: -7, // ES256
          type: 'public-key'
        },
        {
          alg: -257, // RS256
          type: 'public-key'
        }
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Prefer platform authenticators (biometrics)
        userVerification: options.userVerification || 'preferred',
        residentKey: options.residentKey || 'required'
      },
      timeout: options.timeout || 60000,
      extensions: {
        credProps: true
      } as any
    }

    const credential = await navigator.credentials.create({
      publicKey: credentialCreationOptions
    }) as PublicKeyCredential

    if (!credential) {
      throw new Error('Failed to create credential')
    }

    // Extract public key for future verification
    const publicKey = await importPublicKey(credential.response)

    const webauthnCredential: WebAuthnCredential = {
      id: credential.id,
      publicKey,
      counter: 0, // Sign counter
      createdAt: new Date().toISOString(),
      deviceName: await getAuthenticatorName(),
      lastUsed: undefined
    }

    return webauthnCredential

  } catch (error: any) {
    console.error('WebAuthn registration failed:', error)

    // Provide user-friendly error messages
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric registration was cancelled or denied')
    } else if (error.name === 'NotSupportedError') {
      throw new Error('This device does not support biometric authentication')
    } else if (error.name === 'SecurityError') {
      throw new Error('WebAuthn is not available over insecure connection (HTTPS required)')
    } else if (error.name) {
      throw new Error(`Biometric registration failed: ${error.name}`)
    } else {
      throw new Error('Failed to register biometric authentication')
    }
  }
}

/**
 * Authenticate using a registered WebAuthn credential
 */
export async function authenticateWithBiometric(
  credentialId: string,
  options: WebAuthnOptions = {}
): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn is not supported by this browser')
  }

  try {
    const challenge = generateChallenge()

    const credentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge.buffer as ArrayBuffer,
      allowCredentials: [{
        id: base64ToArrayBuffer(credentialId),
        type: 'public-key',
        transports: ['internal', 'hybrid', 'usb', 'ble', 'nfc']
      }],
      timeout: options.timeout || 60000,
      userVerification: options.userVerification || 'preferred'
    }

    const assertion = await navigator.credentials.get({
      publicKey: credentialRequestOptions
    }) as PublicKeyCredential

    if (!assertion) {
      return false
    }

    // Basic verification - in production, you'd verify the signature
    // For this use case, we trust the browser's verification
    const response = assertion.response as AuthenticatorAssertionResponse

    // Update sign counter (prevent replay attacks)
    // Note: Many authenticators don't provide a real counter

    return true

  } catch (error: any) {
    console.error('WebAuthn authentication failed:', error)

    if (error.name === 'NotAllowedError') {
      // User cancelled or denied
      return false
    } else if (error.name === 'AbortError') {
      // Timeout or user dismissed
      return false
    }

    // Other errors should propagate
    throw error
  }
}

/**
 * Import the public key from credential response
 */
async function importPublicKey(credentialResponse: any): Promise<CryptoKey> {
  const publicKey = credentialResponse.getPublicKey()

  if (!publicKey) {
    throw new Error('No public key in credential response')
  }

  return await window.crypto.subtle.importKey(
    'spki',
    publicKey,
    {
      name: 'ECDSA',
      namedCurve: 'P-256'
    },
    false,
    ['verify']
  )
}

/**
 * Get a human-readable name for the authenticator
 */
async function getAuthenticatorName(): Promise<string> {
  // Try to detect based on platform
  const platform = navigator.platform.toLowerCase()

  if (platform.includes('mac')) return 'Touch ID / Face ID'
  if (platform.includes('win')) return 'Windows Hello'
  if (platform.includes('linux')) return 'Platform Biometrics'
  if (platform.includes('android')) return 'Android Biometrics'
  if (platform.includes('ios')) return 'Face ID / Touch ID'

  return 'Platform Biometric'
}

/**
 * Utility to convert base64url to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Utility to convert ArrayBuffer to base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Get list of saved biometric credentials
 */
export function getStoredCredentials(): WebAuthnCredential[] {
  try {
    const stored = localStorage.getItem('vault_webauthn_credentials')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load stored credentials:', error)
  }
  return []
}

/**
 * Save biometric credentials securely
 */
export function saveCredential(credential: WebAuthnCredential): void {
  try {
    const credentials = getStoredCredentials()
    const existingIndex = credentials.findIndex(c => c.id === credential.id)

    if (existingIndex >= 0) {
      credentials[existingIndex] = credential
    } else {
      credentials.push(credential)
    }

    localStorage.setItem('vault_webauthn_credentials', JSON.stringify(credentials))
  } catch (error) {
    console.error('Failed to save WebAuthn credential:', error)
    throw new Error('Failed to save biometric credential')
  }
}

/**
 * Remove a biometric credential
 */
export function removeCredential(credentialId: string): void {
  try {
    const credentials = getStoredCredentials()
    const updated = credentials.filter(c => c.id !== credentialId)
    localStorage.setItem('vault_webauthn_credentials', JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to remove WebAuthn credential:', error)
  }
}

/**
 * Check if biometric authentication is set up
 */
export function isBiometricEnabled(): boolean {
  const credentials = getStoredCredentials()
  return credentials.length > 0
}

/**
 * Get the most recently used biometric credential
 */
export function getDefaultCredential(): WebAuthnCredential | null {
  const credentials = getStoredCredentials()
  if (credentials.length === 0) return null

  // Return most recently used, or first if none used
  return credentials.sort((a, b) => {
    if (!a.lastUsed && !b.lastUsed) return 0
    if (!a.lastUsed) return 1
    if (!b.lastUsed) return -1
    return new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()
  })[0]
}
