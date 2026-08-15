// Optional passphrase encryption for exported backups — pure logic, no RN or native
// imports (needs react-native-get-random-values polyfilled once at the app entry point;
// see index.js). Kept separate from backupSchema.ts so the plaintext envelope format
// stays simple and this module can be tested independently.
//
// AES-256-GCM (authenticated encryption) with a PBKDF2-HMAC-SHA256-derived key. Unlike
// the PIN in security.ts, a backup passphrase is expected to have real entropy and
// decryption only happens once per export/import (not on every unlock), so this uses a
// much higher iteration count — the ~1-2s it costs here is a non-issue.

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes, bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { gcm } from '@noble/ciphers/aes.js';

const ITERATIONS = 300_000;
const KEY_LENGTH = 32; // AES-256
const SALT_LENGTH = 16;
const NONCE_LENGTH = 12; // GCM's recommended nonce length

export const ENCRYPTED_BACKUP_VERSION = 1;

export interface EncryptedPayload {
  encrypted: true;
  v: typeof ENCRYPTED_BACKUP_VERSION;
  kdf: 'pbkdf2-sha256';
  iterations: number;
  salt: string;
  nonce: string;
  ciphertext: string;
}

export function isEncryptedPayload(raw: unknown): raw is EncryptedPayload {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as any).encrypted === true &&
    typeof (raw as any).salt === 'string' &&
    typeof (raw as any).nonce === 'string' &&
    typeof (raw as any).ciphertext === 'string' &&
    typeof (raw as any).iterations === 'number'
  );
}

async function deriveKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  return pbkdf2Async(sha256, passphrase, salt, { c: iterations, dkLen: KEY_LENGTH });
}

/**
 * Minimal UTF-8 byte decoder. Hermes has supported a native `TextEncoder` since RN 0.74
 * (which `@noble/hashes`'s `utf8ToBytes` relies on for the encode direction) but still
 * has no native `TextDecoder` at all as of this writing — relying on one here would
 * crash on-device despite working fine under Jest's Node environment. This handles the
 * full UTF-8 byte-length range, including 4-byte sequences (e.g. emoji) via
 * `String.fromCodePoint`, which correctly produces the JS surrogate pair.
 */
function bytesToUtf8(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  while (i < bytes.length) {
    const b0 = bytes[i];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      i += 1;
    } else if ((b0 & 0xe0) === 0xc0) {
      out += String.fromCharCode(((b0 & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if ((b0 & 0xf0) === 0xe0) {
      out += String.fromCharCode(((b0 & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f));
      i += 3;
    } else {
      const code =
        ((b0 & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      out += String.fromCodePoint(code);
      i += 4;
    }
  }
  return out;
}

export async function encryptBackupJson(plaintext: string, passphrase: string): Promise<EncryptedPayload> {
  const salt = randomBytes(SALT_LENGTH);
  const nonce = randomBytes(NONCE_LENGTH);
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const ciphertext = gcm(key, nonce).encrypt(utf8ToBytes(plaintext));
  return {
    encrypted: true,
    v: ENCRYPTED_BACKUP_VERSION,
    kdf: 'pbkdf2-sha256',
    iterations: ITERATIONS,
    salt: bytesToHex(salt),
    nonce: bytesToHex(nonce),
    ciphertext: bytesToHex(ciphertext),
  };
}

/** Returns the decrypted JSON string, or null if the passphrase is wrong or the file was
 * tampered with (GCM's authentication tag fails to verify either way — this module
 * intentionally can't tell those two cases apart, which is the correct behavior for an
 * AEAD: a "which one was wrong" answer would leak information to an attacker). */
export async function decryptBackupJson(payload: EncryptedPayload, passphrase: string): Promise<string | null> {
  try {
    const key = await deriveKey(passphrase, hexToBytes(payload.salt), payload.iterations);
    const plaintextBytes = gcm(key, hexToBytes(payload.nonce)).decrypt(hexToBytes(payload.ciphertext));
    return bytesToUtf8(plaintextBytes);
  } catch {
    return null;
  }
}
