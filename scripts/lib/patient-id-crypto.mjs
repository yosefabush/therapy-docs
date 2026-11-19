// Plain-JS twin of encryptIdNumber() in src/lib/data/patient-crypto.ts, for the
// CLI/container scripts that cannot import the TypeScript app code. It must
// produce the same format: `enc:v1:` + base64(salt(16) | iv(12) | tag(16) | ct),
// key = scrypt(ENCRYPTION_KEY, salt.hex, 32). Covered by patient-crypto.test.ts.

import crypto from 'crypto';

export const ENCRYPTED_ID_PREFIX = 'enc:v1:';

// Mirrors requireSecret() in src/lib/env.ts.
const DEV_FALLBACK_KEY = 'dev-only-insecure-key-change-me-1234567890';

function encryptionKey() {
  const value = process.env.ENCRYPTION_KEY;
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing required environment variable "ENCRYPTION_KEY". Refusing to use insecure defaults in production.'
    );
  }
  return DEV_FALLBACK_KEY;
}

export function isEncryptedIdNumber(value) {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_ID_PREFIX);
}

export function encryptIdNumber(value) {
  if (typeof value !== 'string' || !value || isEncryptedIdNumber(value)) return value;
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(encryptionKey(), salt.toString('hex'), 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(value, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENCRYPTED_ID_PREFIX + Buffer.concat([salt, iv, tag, ct]).toString('base64');
}

export function encryptPatient(patient) {
  return { ...patient, idNumber: encryptIdNumber(patient.idNumber) };
}
