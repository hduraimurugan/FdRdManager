import { hashPin, verifyPin, validatePinFormat, serializeStoredPin, parseStoredPin, lockoutDelaySeconds, StoredPin } from './security';

describe('validatePinFormat', () => {
  it('accepts a 4-8 digit numeric PIN', () => {
    expect(validatePinFormat('1234')).toBeNull();
    expect(validatePinFormat('12345678')).toBeNull();
  });

  it('rejects non-numeric input', () => {
    expect(validatePinFormat('12ab')).toMatch(/numbers only/);
  });

  it('rejects a PIN shorter than 4 digits', () => {
    expect(validatePinFormat('123')).toMatch(/4-8 digits/);
  });

  it('rejects a PIN longer than 8 digits', () => {
    expect(validatePinFormat('123456789')).toMatch(/4-8 digits/);
  });

  it('rejects an empty string', () => {
    expect(validatePinFormat('')).not.toBeNull();
  });
});

describe('hashPin / verifyPin', () => {
  it('a hashed PIN verifies successfully against the same PIN', async () => {
    const stored = await hashPin('4242');
    await expect(verifyPin('4242', stored)).resolves.toBe(true);
  });

  it('rejects a wrong PIN', async () => {
    const stored = await hashPin('4242');
    await expect(verifyPin('9999', stored)).resolves.toBe(false);
  });

  it('rejects a PIN that only partially matches (prefix)', async () => {
    const stored = await hashPin('424242');
    await expect(verifyPin('4242', stored)).resolves.toBe(false);
  });

  it('never stores the PIN itself — only a hash and salt', async () => {
    const stored = await hashPin('1234');
    expect(stored.hash).not.toContain('1234');
    expect(JSON.stringify(stored)).not.toContain('1234');
  });

  it('produces a different salt (and therefore a different hash) each time, even for the same PIN', async () => {
    const a = await hashPin('4242');
    const b = await hashPin('4242');
    expect(a.salt).not.toBe(b.salt);
    expect(a.hash).not.toBe(b.hash);
    // ...but both still verify correctly against their own record.
    await expect(verifyPin('4242', a)).resolves.toBe(true);
    await expect(verifyPin('4242', b)).resolves.toBe(true);
  });
});

describe('serializeStoredPin / parseStoredPin', () => {
  it('round-trips through JSON', async () => {
    const stored = await hashPin('1234');
    const parsed = parseStoredPin(serializeStoredPin(stored));
    expect(parsed).toEqual(stored);
  });

  it('returns null for a missing value', () => {
    expect(parseStoredPin(null)).toBeNull();
  });

  it('returns null for malformed JSON rather than throwing', () => {
    expect(parseStoredPin('{not json')).toBeNull();
  });

  it('returns null for well-formed JSON missing the expected shape', () => {
    expect(parseStoredPin(JSON.stringify({ foo: 'bar' }))).toBeNull();
  });

  it('a round-tripped record still verifies the original PIN', async () => {
    const stored = await hashPin('7777');
    const parsed = parseStoredPin(serializeStoredPin(stored)) as StoredPin;
    await expect(verifyPin('7777', parsed)).resolves.toBe(true);
  });
});

describe('lockoutDelaySeconds', () => {
  it('imposes no delay for the first few wrong attempts', () => {
    expect(lockoutDelaySeconds(0)).toBe(0);
    expect(lockoutDelaySeconds(4)).toBe(0);
  });

  it('escalates the delay as failures accumulate', () => {
    expect(lockoutDelaySeconds(5)).toBe(30);
    expect(lockoutDelaySeconds(6)).toBe(60);
    expect(lockoutDelaySeconds(7)).toBe(120);
    expect(lockoutDelaySeconds(8)).toBe(300);
  });

  it('caps the delay rather than growing unboundedly', () => {
    expect(lockoutDelaySeconds(50)).toBe(300);
  });

  it('is monotonically non-decreasing', () => {
    let prev = 0;
    for (let n = 0; n <= 20; n++) {
      const delay = lockoutDelaySeconds(n);
      expect(delay).toBeGreaterThanOrEqual(prev);
      prev = delay;
    }
  });
});
