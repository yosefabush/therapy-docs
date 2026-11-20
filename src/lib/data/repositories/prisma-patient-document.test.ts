import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

type Row = { id: string; patientId: string; payload: unknown; content: string; createdAt: Date };
const rows: Row[] = [];
const selects: Record<string, unknown>[] = [];

vi.mock('../prisma', () => ({
  USE_PRISMA: true,
  prisma: {
    user: {}, patient: {}, session: {}, treatmentGoal: {}, report: {}, voiceRecording: {}, patientInsights: {},
    patientDocument: {
      create: async ({ data, select }: { data: Omit<Row, 'createdAt'>; select: Record<string, unknown> }) => {
        selects.push(select);
        const row = { ...data, createdAt: new Date() };
        rows.push(row);
        return row;
      },
      findMany: async ({ where, select }: { where: { patientId: string }; select: Record<string, unknown> }) => {
        selects.push(select);
        return rows.filter((r) => r.patientId === where.patientId);
      },
      findUnique: async ({ where, select }: { where: { id: string }; select: Record<string, unknown> }) => {
        selects.push(select);
        return rows.find((r) => r.id === where.id) ?? null;
      },
      deleteMany: async ({ where }: { where: { id: string } }) => {
        const i = rows.findIndex((r) => r.id === where.id);
        if (i >= 0) rows.splice(i, 1);
        return { count: i >= 0 ? 1 : 0 };
      },
    },
  },
}));

import { patientDocumentPrismaRepository as repo } from './prisma.repositories';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});
beforeEach(() => {
  rows.length = 0;
  selects.length = 0;
});

const bytes = Buffer.concat([Buffer.from('%PDF-1.4 SECRETBODY'), Buffer.from([0, 255, 254])]);

describe('Prisma mode: patient documents', () => {
  it('stores ciphertext for the content and the file name, plaintext only for metadata', async () => {
    const meta = await repo.add({
      patientId: 'p1', name: 'סודי.pdf', mimeType: 'application/pdf', uploadedBy: 'u1', bytes,
    });
    expect(meta).toMatchObject({ name: 'סודי.pdf', size: bytes.length, patientId: 'p1' });
    expect(rows[0].content.startsWith('enc:v1:')).toBe(true);
    const payload = JSON.stringify(rows[0].payload);
    expect(payload).not.toContain('סודי');
    expect(rows[0].content).not.toContain('SECRETBODY');
    expect((rows[0].payload as { mimeType: string }).mimeType).toBe('application/pdf');
  });

  it('round-trips the bytes and never selects the content column for metadata reads', async () => {
    const meta = await repo.add({ patientId: 'p1', name: 'a.pdf', mimeType: 'application/pdf', uploadedBy: 'u1', bytes });
    selects.length = 0;
    await repo.listByPatient('p1');
    await repo.findById(meta.id);
    expect(selects.every((s) => !('content' in s))).toBe(true);

    const back = await repo.readContent(meta.id);
    expect(Buffer.compare(back!, bytes)).toBe(0);
    expect(selects[selects.length - 1]).toEqual({ content: true });
  });

  it('deletes and reports missing documents', async () => {
    const meta = await repo.add({ patientId: 'p1', name: 'a.pdf', mimeType: 'application/pdf', uploadedBy: 'u1', bytes });
    expect(await repo.delete(meta.id)).toBe(true);
    expect(await repo.delete(meta.id)).toBe(false);
    expect(await repo.readContent(meta.id)).toBeNull();
  });
});
