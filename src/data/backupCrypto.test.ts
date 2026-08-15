import { encryptBackupJson, decryptBackupJson, isEncryptedPayload, ENCRYPTED_BACKUP_VERSION } from './backupCrypto';

describe('encryptBackupJson / decryptBackupJson', () => {
  it('round-trips plain ASCII JSON', async () => {
    const plaintext = JSON.stringify({ fixedDeposits: [{ id: 'fd-1', bankName: 'HDFC Bank' }] });
    const payload = await encryptBackupJson(plaintext, 'correct horse battery staple');
    await expect(decryptBackupJson(payload, 'correct horse battery staple')).resolves.toBe(plaintext);
  });

  it('round-trips non-ASCII text — 2, 3, and 4-byte UTF-8 sequences (café, ₹, emoji)', async () => {
    // Guards the hand-written UTF-8 decoder in backupCrypto.ts (Hermes has no native
    // TextDecoder), which must handle every UTF-8 byte-length case correctly:
    // café → 2-byte (é), ₹ → 3-byte, 🏦 → 4-byte (astral plane, surrogate pair in JS).
    const plaintext = JSON.stringify({ fdHolderName: 'José Café ₹ Owner 🏦', remarks: 'नमस्ते' });
    const payload = await encryptBackupJson(plaintext, 'p@ssphrase');
    await expect(decryptBackupJson(payload, 'p@ssphrase')).resolves.toBe(plaintext);
  });

  it('returns null (not throws) for a wrong passphrase', async () => {
    const payload = await encryptBackupJson('{"a":1}', 'right-passphrase');
    await expect(decryptBackupJson(payload, 'wrong-passphrase')).resolves.toBeNull();
  });

  it('returns null (not throws) if the ciphertext was tampered with', async () => {
    const payload = await encryptBackupJson('{"a":1}', 'passphrase');
    const tampered = { ...payload, ciphertext: payload.ciphertext.slice(0, -2) + (payload.ciphertext.slice(-2) === '00' ? '01' : '00') };
    await expect(decryptBackupJson(tampered, 'passphrase')).resolves.toBeNull();
  });

  it('produces a different salt, nonce, and ciphertext each time, even for the same plaintext and passphrase', async () => {
    const a = await encryptBackupJson('{"a":1}', 'passphrase');
    const b = await encryptBackupJson('{"a":1}', 'passphrase');
    expect(a.salt).not.toBe(b.salt);
    expect(a.nonce).not.toBe(b.nonce);
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('never leaks the plaintext into the encrypted payload', async () => {
    const plaintext = JSON.stringify({ bankAccountNumber: '111122223333' });
    const payload = await encryptBackupJson(plaintext, 'passphrase');
    expect(JSON.stringify(payload)).not.toContain('111122223333');
  });

  it('stamps the current envelope version and KDF name', async () => {
    const payload = await encryptBackupJson('{}', 'x');
    expect(payload.v).toBe(ENCRYPTED_BACKUP_VERSION);
    expect(payload.kdf).toBe('pbkdf2-sha256');
    expect(payload.encrypted).toBe(true);
  });
});

describe('isEncryptedPayload', () => {
  it('recognizes a real encrypted payload', async () => {
    const payload = await encryptBackupJson('{}', 'x');
    expect(isEncryptedPayload(payload)).toBe(true);
  });

  it('rejects a plain (unencrypted) backup envelope', () => {
    expect(isEncryptedPayload({ app: 'FdRdManager', schemaVersion: 1, fixedDeposits: [], recurringDeposits: [] })).toBe(false);
  });

  it('rejects non-objects and null', () => {
    expect(isEncryptedPayload(null)).toBe(false);
    expect(isEncryptedPayload('a string')).toBe(false);
    expect(isEncryptedPayload(42)).toBe(false);
  });

  it('rejects an object missing required fields', () => {
    expect(isEncryptedPayload({ encrypted: true })).toBe(false);
  });
});
