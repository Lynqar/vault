// crypto.ts - Web Crypto helpers
const encoder = new TextEncoder()
const decoder = new TextDecoder()

// utils
export function toBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}
export function fromBase64(b64: string) {
  const str = atob(b64)
  const arr = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i)
  return arr.buffer
}
export function genRandomBytes(len = 16) {
  const b = crypto.getRandomValues(new Uint8Array(len))
  return b.buffer
}
export function genSalt() {
  return genRandomBytes(16)
}
export function genIV() {
  // AES-GCM expects 12-byte IV recommended
  return genRandomBytes(12)
}

// Derive key from password using PBKDF2
export async function deriveKey(
  password: string,
  saltB64: string,
  iterations = 200000
) {
  const salt = fromBase64(saltB64)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )
  // derive an AES-GCM 256-bit key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  return key
}

// Export symmetric key to raw bytes (for wrapping or storing in session if needed)
export async function exportCryptoKey(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey('raw', key)
  return toBase64(raw)
}
export async function importCryptoKey(rawB64: string) {
  const raw = fromBase64(rawB64)
  return crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
}

// Encrypt a JSON object
export async function encryptJSON(key: CryptoKey, payload: any) {
  const iv = genIV()
  const pt = encoder.encode(JSON.stringify(payload))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt)
  return {
    version: 1,
    iv: toBase64(iv),
    cipher: toBase64(ct)
  }
}

// Decrypt to JSON
export async function decryptJSON(key: CryptoKey, encrypted: { iv: string, cipher: string}) {
  const iv = fromBase64(encrypted.iv)
  const ct = fromBase64(encrypted.cipher)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  const json = decoder.decode(pt)
  return JSON.parse(json)
}

// Helper to create salt b64
export function saltToB64(saltBuffer: ArrayBuffer) {
  return toBase64(saltBuffer)
}
