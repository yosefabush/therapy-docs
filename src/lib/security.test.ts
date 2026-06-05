import { describe, it, expect, beforeAll } from 'vitest';
import {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword,
  isHashedPassword,
  hashForSearch,
  createSessionToken,
  verifySessionToken,
  sanitizeInput,
  checkRateLimit,
  generatePatientCode,
} from './security';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
  process.env.JWT_SECRET = 'test-jwt-secret-value';
  process.env.SEARCH_HASH_KEY = 'test-search-secret-value';
});

describe('encryptData / decryptData (AES-256-GCM)', () => {
  it('round-trips plaintext, including non-ASCII', () => {
    const plaintext = 'PHI: patient note חסוי 🩺';
    expect(decryptData(encryptData(plaintext))).toBe(plaintext);
  });

  it('produces different ciphertext for the same input (random IV/salt)', () => {
    expect(encryptData('same')).not.toBe(encryptData('same'));
  });

  it('rejects tampered ciphertext (authentication)', () => {
    const buf = Buffer.from(encryptData('secret'), 'base64');
    buf[buf.length - 1] ^= 0xff;
    expect(() => decryptData(buf.toString('base64'))).toThrow();
  });
});

describe('password hashing (bcrypt)', () => {
  it('verifies a correct password and rejects an incorrect one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('does not store the plaintext password', async () => {
    const hash = await hashPassword('plaintext-secret');
    expect(hash).not.toContain('plaintext-secret');
  });

  it('detects bcrypt hashes vs legacy plaintext', async () => {
    const hash = await hashPassword('x');
    expect(isHashedPassword(hash)).toBe(true);
    expect(isHashedPassword('password123')).toBe(false);
  });
});

describe('hashForSearch (keyed HMAC)', () => {
  it('is deterministic and case/whitespace insensitive', () => {
    expect(hashForSearch('Alice@Example.com')).toBe(
      hashForSearch('  alice@example.com  ')
    );
  });

  it('differs for different inputs', () => {
    expect(hashForSearch('a')).not.toBe(hashForSearch('b'));
  });
});

describe('session tokens (JWT)', () => {
  it('signs and verifies a valid token', async () => {
    const token = await createSessionToken({ sub: 'user-1' });
    const payload = await verifySessionToken(token);
    expect(payload?.sub).toBe('user-1');
  });

  it('returns null for a tampered token', async () => {
    const token = await createSessionToken({ sub: 'user-1' });
    expect(await verifySessionToken(token + 'tamper')).toBeNull();
  });

  it('returns null for an expired token', async () => {
    const token = await createSessionToken({ sub: 'user-1' }, '0s');
    await new Promise((r) => setTimeout(r, 1100));
    expect(await verifySessionToken(token)).toBeNull();
  });
});

describe('sanitizeInput', () => {
  it('escapes HTML special characters', () => {
    expect(sanitizeInput('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
    );
  });
});

describe('checkRateLimit', () => {
  it('allows up to the limit then blocks', () => {
    const id = `test-${Math.random()}`;
    expect(checkRateLimit(id, 3, 60_000)).toBe(true);
    expect(checkRateLimit(id, 3, 60_000)).toBe(true);
    expect(checkRateLimit(id, 3, 60_000)).toBe(true);
    expect(checkRateLimit(id, 3, 60_000)).toBe(false);
  });
});

describe('generatePatientCode', () => {
  it('produces unique, prefixed codes', () => {
    const a = generatePatientCode();
    const b = generatePatientCode();
    expect(a).toMatch(/^PT-/);
    expect(a).not.toBe(b);
  });
});
