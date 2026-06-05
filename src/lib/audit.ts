// Append-only audit logging for PHI access (HIPAA requirement).
//
// Backed by Postgres (an append-only AuditEntry table) when DATABASE_URL is
// set, otherwise by an `audit-log.json` file. In production the table should
// additionally be made tamper-evident and retained per policy.

import { readJsonFile, writeJsonFile } from '@/lib/data/json-store';
import { USE_PRISMA, prisma } from '@/lib/data/prisma';
import { createAuditEntry, type AuditEntry } from '@/lib/security';
import { logger } from '@/lib/logger';

const AUDIT_FILE = 'audit-log.json';

export async function recordAudit(
  entry: Omit<AuditEntry, 'timestamp'>
): Promise<void> {
  try {
    if (USE_PRISMA) {
      await prisma.auditEntry.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          ipAddress: entry.ipAddress,
          details: entry.details,
        },
      });
      return;
    }
    const log = await readJsonFile<AuditEntry>(AUDIT_FILE);
    log.push(createAuditEntry(entry));
    await writeJsonFile(AUDIT_FILE, log);
  } catch (error) {
    // Auditing must never break the primary request, but failures are notable.
    logger.error('Failed to write audit entry:', error);
  }
}

