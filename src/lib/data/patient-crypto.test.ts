import { describe, it, expect, beforeAll } from 'vitest';
import {
  ENCRYPTED_ID_PREFIX,
  encryptIdNumber,
  decryptIdNumber,
  isEncryptedIdNumber,
  encryptPatientForStorage,
  decryptPatientFromStorage,
} from './patient-crypto';
// Plain-JS twin used by the CLI/container scripts; must stay format-compatible.
import { encryptIdNumber as encryptIdNumberScript } from '../../../scripts/lib/patient-id-crypto.mjs';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});

describe('patient idNumber at-rest encryption', () => {
  it('round-trips and never stores the plaintext', () => {
    const stored = encryptIdNumber('012345678');
    expect(stored.startsWith(ENCRYPTED_ID_PREFIX)).toBe(true);
    expect(stored).not.toContain('012345678');
    expect(decryptIdNumber(stored)).toBe('012345678');
  });

  it('reads legacy plaintext values unchanged', () => {
    expect(isEncryptedIdNumber('012345678')).toBe(false);
    expect(decryptIdNumber('012345678')).toBe('012345678');
  });

  it('does not double-encrypt an already encrypted value', () => {
    const stored = encryptIdNumber('012345678');
    expect(encryptIdNumber(stored)).toBe(stored);
  });

  it('fails loudly when decrypted with the wrong key', () => {
    const stored = encryptIdNumber('012345678');
    process.env.ENCRYPTION_KEY = 'a-different-key';
    try {
      expect(() => decryptIdNumber(stored)).toThrow();
    } finally {
      process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
    }
  });

  it('transforms only idNumber on a patient record', () => {
    const patient = { id: 'p1', firstName: 'Dana', idNumber: '023456789' };
    const stored = encryptPatientForStorage(patient);
    expect(stored.firstName).toBe('Dana');
    expect(isEncryptedIdNumber(stored.idNumber)).toBe(true);
    expect(decryptPatientFromStorage(stored)).toEqual(patient);
    expect(decryptPatientFromStorage(patient)).toEqual(patient); // legacy row
  });

  it('values written by the seed/backfill scripts decrypt in the app', () => {
    const stored = encryptIdNumberScript('034567890');
    expect(isEncryptedIdNumber(stored)).toBe(true);
    expect(decryptIdNumber(stored)).toBe('034567890');
  });
});
