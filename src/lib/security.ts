// Security utilities for HIPAA-compliant data handling
// In production, use a proper key management service (AWS KMS, Azure Key Vault, etc.)

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'demo-key-replace-in-production-32ch';

// Simple XOR-based encryption for demo purposes
// In production, use Web Crypto API or a proper encryption library
export function encryptData(plaintext: string): string {
  if (typeof window === 'undefined') {
    // Server-side encryption
    const buffer = Buffer.from(plaintext, 'utf-8');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const encrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      encrypted[i] = buffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return encrypted.toString('base64');
  }
  
  // Client-side - return base64 encoded (demo only)
  return btoa(encodeURIComponent(plaintext));
}

export function decryptData(ciphertext: string): string {
  if (typeof window === 'undefined') {
    // Server-side decryption
    const buffer = Buffer.from(ciphertext, 'base64');
    const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'utf-8');
    const decrypted = Buffer.alloc(buffer.length);
    
    for (let i = 0; i < buffer.length; i++) {
      decrypted[i] = buffer[i] ^ keyBuffer[i % keyBuffer.length];
    }
    
    return decrypted.toString('utf-8');
  }
  
  // Client-side
  return decodeURIComponent(atob(ciphertext));
}

// Hash function for searchable fields (one-way)
export function hashForSearch(value: string): string {
  // Simple hash for demo - use bcrypt or argon2 in production
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// Generate secure patient code
export function generatePatientCode(): string {
  const prefix = 'PT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Validate session token structure
export function isValidSessionToken(token: string): boolean {
  // JWT format validation
  const parts = token.split('.');
  return parts.length === 3;
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
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

// Mask sensitive data for logging
export function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['password', 'ssn', 'email', 'phone', 'address', 'name', 'dateOfBirth'];
  const masked = { ...data };
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      masked[field] = '***REDACTED***';
    }
  }
  
  return masked;
}

// HIPAA-compliant audit logging
export interface AuditEntry {
  timestamp: Date;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  details?: string;
}

export function createAuditEntry(entry: Omit<AuditEntry, 'timestamp'>): AuditEntry {
  return {
    ...entry,
    timestamp: new Date(),
  };
}
