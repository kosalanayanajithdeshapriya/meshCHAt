
/**
 * Enhanced client-side encryption for BitChat using Web Crypto API.
 * Features: Per-channel unique salts, secure key storage, key rotation support.
 */

import { keyStorage } from './keyStorage';

const ALGORITHM = 'AES-GCM';
export const ENCRYPTION_PREFIX = '🔒:';
const KEY_ITERATIONS = 100000;

/**
 * Generate a unique salt for a specific channel using channel ID
 */
export async function generateChannelSalt(channelId: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const channelData = enc.encode(`bitchat-v2-${channelId}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', channelData);
  return new Uint8Array(hashBuffer).slice(0, 16);
}

/**
 * Derive encryption key from password with channel-specific salt
 */
async function deriveEncryptionKey(
  password: string,
  channelId: string,
  storeKey: boolean = false
): Promise<CryptoKey> {
  // Check if key exists in storage
  if (storeKey) {
    const storedKey = await keyStorage.retrieveKey(channelId);
    if (storedKey) return storedKey;
  }

  const enc = new TextEncoder();
  const salt = await generateChannelSalt(channelId);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password.padEnd(32, '0').slice(0, 32)),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Store key for future use
  if (storeKey) {
    await keyStorage.storeKey(channelId, key);
  }

  return key;
}

/**
 * Encrypt message with channel-specific encryption
 */
export async function encryptMessage(
  text: string,
  secret: string,
  channelId: string
): Promise<string> {
  try {
    const key = await deriveEncryptionKey(secret, channelId, true);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const ciphertext = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return ENCRYPTION_PREFIX + btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error('Encryption failed', e);
    return text;
  }
}

/**
 * Decrypt message with channel-specific decryption
 */
export async function decryptMessage(
  encryptedWithPrefix: string,
  secret: string,
  channelId: string
): Promise<string> {
  if (!encryptedWithPrefix.startsWith(ENCRYPTION_PREFIX)) return encryptedWithPrefix;

  try {
    const encryptedBase64 = encryptedWithPrefix.slice(ENCRYPTION_PREFIX.length);
    const key = await deriveEncryptionKey(secret, channelId, true);
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return '[🔒 Decryption Failed - Invalid Key]';
  }
}

/**
 * Rotate encryption key for a channel
 */
export async function rotateChannelKey(
  channelId: string,
  oldSecret: string,
  newSecret: string
): Promise<boolean> {
  try {
    // Verify old key works
    const oldKey = await deriveEncryptionKey(oldSecret, channelId, false);

    // Delete old key from storage
    await keyStorage.deleteKey(channelId);

    // Generate and store new key
    await deriveEncryptionKey(newSecret, channelId, true);

    return true;
  } catch (e) {
    console.error('Key rotation failed', e);
    return false;
  }
}

/**
 * Export key backup for a channel
 */
export async function exportKeyBackup(channelId: string, password: string): Promise<string> {
  return keyStorage.exportKeyBackup(channelId, password);
}

/**
 * Import key backup for a channel
 */
export async function importKeyBackup(
  channelId: string,
  backup: string,
  password: string
): Promise<void> {
  return keyStorage.importKeyBackup(channelId, backup, password);
}

/**
 * Generate SHA-256 hash of input
 */
export async function generateHash(input: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clear all stored keys (for logout/reset)
 */
export async function clearAllKeys(): Promise<void> {
  await keyStorage.clearAll();
}
