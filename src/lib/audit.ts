// Append-only audit logging for PHI access (HIPAA requirement).
//
// In production this should write to a tamper-evident, separate, retained
// store. Here it appends to an `audit-log.json` collection via the same
// json-store; the call sites and shape are what matter for the migration.

import { readJsonFile, writeJsonFile } from '@/lib/data/json-store';
import { createAuditEntry, type AuditEntry } from '@/lib/security';
import { logger } from '@/lib/logger';

const AUDIT_FILE = 'audit-log.json';

export async function recordAudit(
  entry: Omit<AuditEntry, 'timestamp'>
): Promise<void> {
  try {
    const log = await readJsonFile<AuditEntry>(AUDIT_FILE);
    log.push(createAuditEntry(entry));
    await writeJsonFile(AUDIT_FILE, log);
  } catch (error) {
    // Auditing must never break the primary request, but failures are notable.
    logger.error('Failed to write audit entry:', error);
  }
}
