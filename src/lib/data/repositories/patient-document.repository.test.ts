import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';

const files = new Map<string, unknown[]>();
vi.mock('../json-store', () => ({
  readJsonFile: async (name: string) => structuredClone(files.get(name) ?? []),
  writeJsonFile: async (name: string, data: unknown[]) => {
    files.set(name, structuredClone(data));
  },
}));

import { patientDocumentRepository } from './patient-document.repository';

beforeAll(() => {
  process.env.ENCRYPTION_KEY = 'test-encryption-secret-value';
});
beforeEach(() => files.clear());

const pdfBytes = Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from([0, 1, 2, 250, 251, 252, 255])]);

describe('patient documents (JSON store)', () => {
  it('stores the content and the file name encrypted, never as plaintext', async () => {
    const meta = await patientDocumentRepository.add({
      patientId: 'p1',
      name: 'הסכמה-חתומה.pdf',
      mimeType: 'application/pdf',
      uploadedBy: 'u1',
      bytes: pdfBytes,
    });
    expect(meta.name).toBe('הסכמה-חתומה.pdf');
    expect(meta.size).toBe(pdfBytes.length);

    const raw = files.get('patient-documents.json') as Record<string, unknown>[];
    expect(raw).toHaveLength(1);
    expect(String(raw[0].content).startsWith('enc:v1:')).toBe(true);
    expect(String(raw[0].encryptedName).startsWith('enc:v1:')).toBe(true);
    const text = JSON.stringify(raw);
    expect(text).not.toContain('הסכמה');
    expect(text).not.toContain(pdfBytes.toString('base64'));
    expect(text).not.toContain('PDF-1.4');
  });

  it('round-trips binary content byte for byte', async () => {
    const meta = await patientDocumentRepository.add({
      patientId: 'p1', name: 'a.pdf', mimeType: 'application/pdf', uploadedBy: 'u1', bytes: pdfBytes,
    });
    const back = await patientDocumentRepository.readContent(meta.id);
    expect(back).not.toBeNull();
    expect(Buffer.compare(back!, pdfBytes)).toBe(0);
  });

  it('lists only the requested patient, newest first, without content', async () => {
    const a = await patientDocumentRepository.add({ patientId: 'p1', name: 'a.txt', mimeType: 'text/plain', uploadedBy: 'u1', bytes: Buffer.from('a') });
    await new Promise((r) => setTimeout(r, 5));
    const b = await patientDocumentRepository.add({ patientId: 'p1', name: 'b.txt', mimeType: 'text/plain', uploadedBy: 'u1', bytes: Buffer.from('b') });
    await patientDocumentRepository.add({ patientId: 'p2', name: 'c.txt', mimeType: 'text/plain', uploadedBy: 'u2', bytes: Buffer.from('c') });

    const list = await patientDocumentRepository.listByPatient('p1');
    expect(list.map((d) => d.id)).toEqual([b.id, a.id]);
    expect(list.every((d) => !('content' in d))).toBe(true);
  });

  it('deletes one document and reports a missing one', async () => {
    const a = await patientDocumentRepository.add({ patientId: 'p1', name: 'a.txt', mimeType: 'text/plain', uploadedBy: 'u1', bytes: Buffer.from('a') });
    expect(await patientDocumentRepository.delete(a.id)).toBe(true);
    expect(await patientDocumentRepository.findById(a.id)).toBeNull();
    expect(await patientDocumentRepository.readContent(a.id)).toBeNull();
    expect(await patientDocumentRepository.delete(a.id)).toBe(false);
  });

  it('fails to decrypt when the ciphertext is tampered with (GCM authentication)', async () => {
    const meta = await patientDocumentRepository.add({
      patientId: 'p1', name: 'a.pdf', mimeType: 'application/pdf', uploadedBy: 'u1', bytes: pdfBytes,
    });
    const raw = files.get('patient-documents.json') as { content: string }[];
    const body = Buffer.from(raw[0].content.slice('enc:v1:'.length), 'base64');
    body[body.length - 1] ^= 0xff;
    raw[0].content = 'enc:v1:' + body.toString('base64');
    await expect(patientDocumentRepository.readContent(meta.id)).rejects.toThrow();
  });
});
