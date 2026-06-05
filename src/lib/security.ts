// Security utilities for HIPAA-compliant data handling.
//
// Encryption keys and secrets MUST be provided via environment variables in
// production (see .env.example). In a real deployment these should be sourced
// from a managed secret store (AWS KMS / Secrets Manager, Azure Key Vault,
// HashiCorp Vault, etc.) rather than plain environment variables.

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireSecret } from '@/lib/env';
import {
  signSessionToken,
  verifySessionToken as verifyToken,
  type SessionPayload,
} from '@/lib/auth/jwt';

// ---------------------------------------------------------------------------
// Key management
// ---------------------------------------------------------------------------

// Derive a stable 32-byte key from the configured secret so the secret length
// does not need to be exactly 32 characters.
function deriveKey(secret: string, salt: string): Buffer {
  return crypto.scryptSync(secret, salt, 32);
}

// ---------------------------------------------------------------------------
// Symmetric encryption (AES-256-GCM, authenticated)
// ---------------------------------------------------------------------------
//
// Output format: base64( salt(16) | iv(12) | authTag(16) | ciphertext )

export function encryptData(plaintext: string): string {
  const secret = requireSecret('ENCRYPTION_KEY');
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveKey(secret, salt.toString('hex'));

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf-8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, authTag, ciphertext]).toString('base64');
}

export function decryptData(payload: string): string {
  const secret = requireSecret('ENCRYPTION_KEY');
  const raw = Buffer.from(payload, 'base64');

  const salt = raw.subarray(0, 16);
  const iv = raw.subarray(16, 28);
  const authTag = raw.subarray(28, 44);
  const ciphertext = raw.subarray(44);

  const key = deriveKey(secret, salt.toString('hex'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf-8');
}

// ---------------------------------------------------------------------------
// Password hashing (bcrypt)
// ---------------------------------------------------------------------------

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Detect whether a stored credential is already a bcrypt hash. Used to migrate
// any legacy plaintext credentials transparently on next successful login.
export function isHashedPassword(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

// ---------------------------------------------------------------------------
// Searchable hashing (deterministic, keyed)
// ---------------------------------------------------------------------------

export function hashForSearch(value: string): string {
  const secret = requireSecret('SEARCH_HASH_KEY');
  return crypto
    .createHmac('sha256', secret)
    .update(value.trim().toLowerCase())
    .digest('hex');
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

export function generatePatientCode(): string {
  const prefix = 'PT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ---------------------------------------------------------------------------
// Input sanitization
// ---------------------------------------------------------------------------

export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// ---------------------------------------------------------------------------
// Session tokens (JWT) — see src/lib/auth/jwt.ts for the edge-safe impl shared
// with middleware. Re-exported here for backwards compatibility.
// ---------------------------------------------------------------------------

export async function createSessionToken(
  payload: SessionPayload,
  expiresIn: string = '8h'
): Promise<string> {
  return signSessionToken(payload, expiresIn);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  return verifyToken(token);
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory; use Redis for multi-instance deployments)
// ---------------------------------------------------------------------------

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Logging helpers
// ---------------------------------------------------------------------------

export function maskSensitiveData(
  data: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'ssn',
    'email',
    'phone',
    'address',
    'name',
    'dateOfBirth',
  ];
  const masked = { ...data };

  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }

  return masked;
}

// ---------------------------------------------------------------------------
// HIPAA-compliant audit logging
// ---------------------------------------------------------------------------

export interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  details?: string;
}

export function createAuditEntry(
  entry: Omit<AuditEntry, 'timestamp'>
): AuditEntry {
  return {
    ...entry,
    timestamp: new Date(),
  };
}
