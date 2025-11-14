// Vault types
export type VaultEntry = {
  id: string;
  title: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  totpSecret?: string; // Base32 encoded TOTP secret
  backupCodes?: string[]; // TOTP backup codes
  createdAt: string;
  updatedAt?: string;
}

export type EncryptedPayload = {
  version: number;
  iv: string; // base64
  cipher: string; // base64 ciphertext
  salt?: string; // base64 (if needed)
}
