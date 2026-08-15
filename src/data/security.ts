// PIN hashing for app lock — pure logic, no RN or native imports (needs
// react-native-get-random-values polyfilled once at the app entry point; see index.js).
//
// The PIN is never stored in plaintext: only a PBKDF2-HMAC-SHA256 hash + its random salt
// go into the settings table. OWASP's 2023 password-storage guidance recommends
// ≥600,000 PBKDF2-SHA256 iterations, but that figure targets attacker-chosen passwords
// with real entropy; a 4-8 digit PIN has at most 10^8 possibilities regardless of KDF
// cost, so the KDF here is defense-in-depth, not the primary defense — the app-level
// lockout after repeated wrong attempts (see AppContext's lock state) is. 100,000
// iterations keeps unlock responsive (low hundreds of ms) on real phones while still
// meaningfully slowing an offline brute-force against an extracted settings table.

import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes, bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
export const MIN_PIN_LENGTH = 4;
export const MAX_PIN_LENGTH = 8;

export interface StoredPin {
  hash: string;
  salt: string;
  iterations: number;
}

/** Returns an error message if `pin` isn't a usable PIN, or null if it's fine. */
export function validatePinFormat(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'PIN must be numbers only';
  if (pin.length < MIN_PIN_LENGTH || pin.length > MAX_PIN_LENGTH) {
    return `PIN must be ${MIN_PIN_LENGTH}-${MAX_PIN_LENGTH} digits`;
  }
  return null;
}

export async function hashPin(pin: string): Promise<StoredPin> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await pbkdf2Async(sha256, pin, salt, { c: ITERATIONS, dkLen: KEY_LENGTH });
  return { hash: bytesToHex(derived), salt: bytesToHex(salt), iterations: ITERATIONS };
}

export async function verifyPin(pin: string, stored: StoredPin): Promise<boolean> {
  const derived = await pbkdf2Async(sha256, pin, hexToBytes(stored.salt), { c: stored.iterations, dkLen: KEY_LENGTH });
  return constantTimeEqualHex(bytesToHex(derived), stored.hash);
}

export function serializeStoredPin(pin: StoredPin): string {
  return JSON.stringify(pin);
}

export function parseStoredPin(raw: string | null): StoredPin | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.hash === 'string' && typeof parsed?.salt === 'string' && typeof parsed?.iterations === 'number') {
      return parsed;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Same-length hex-string comparison in constant time, so a failed unlock attempt can't
 * be timed to learn how many leading hash bytes matched. */
function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Lockout after repeated wrong PINs — the actual brute-force defense (see the
// comment on ITERATIONS above). Escalating delay, capped, persisted across app
// restarts by the caller (AppContext stores failedAttempts/lockoutUntil in settings).
// ---------------------------------------------------------------------------
const LOCKOUT_SCHEDULE: { attempts: number; delaySeconds: number }[] = [
  { attempts: 5, delaySeconds: 30 },
  { attempts: 6, delaySeconds: 60 },
  { attempts: 7, delaySeconds: 120 },
  { attempts: 8, delaySeconds: 300 },
];

/** How long (in seconds) the next attempt must wait, given how many consecutive wrong
 * PINs preceded it. 0 for the first few attempts; escalates and then caps. */
export function lockoutDelaySeconds(failedAttempts: number): number {
  let delay = 0;
  for (const { attempts, delaySeconds } of LOCKOUT_SCHEDULE) {
    if (failedAttempts >= attempts) delay = delaySeconds;
  }
  return delay;
}
