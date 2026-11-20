import { describe, it, expect } from 'vitest';
import {
  MAX_DOCUMENT_BYTES,
  checkDocument,
  checkDocumentMeta,
  sanitizeFileName,
  matchesMagicBytes,
} from './validate';

const bytes = (...b: number[]) => new Uint8Array(b);
const pdf = new TextEncoder().encode('%PDF-1.7\n%âãÏÓ\n1 0 obj');
const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const jpg = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const zip = bytes(0x50, 0x4b, 0x03, 0x04, 0, 0);
const ole = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);
const txt = new TextEncoder().encode('שלום עולם\nhello');
const exe = bytes(0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0);

describe('checkDocument: allowed types', () => {
  const cases: [string, string, Uint8Array][] = [
    ['a.pdf', 'application/pdf', pdf],
    ['a.png', 'image/png', png],
    ['a.jpg', 'image/jpeg', jpg],
    ['a.JPEG', 'image/jpeg', jpg],
    ['a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', zip],
    ['a.doc', 'application/msword', ole],
    ['a.txt', 'text/plain', txt],
    ['a.txt', 'text/plain;charset=utf-8', txt],
    ['a.docx', '', zip], // browser could not classify it: magic bytes decide
    ['a.docx', 'application/octet-stream', zip],
  ];
  for (const [name, type, data] of cases) {
    it(`accepts ${name} (${type || 'no mime'})`, () => {
      const r = checkDocument({ name, size: data.length, type }, data);
      expect(r.ok).toBe(true);
    });
  }
});

describe('checkDocument: rejections', () => {
  it('rejects disallowed extensions even with a friendly MIME', () => {
    for (const name of ['evil.exe', 'x.html', 'x.svg', 'x.js', 'noext', 'x.pdf.exe', '.pdf']) {
      const r = checkDocument({ name, size: exe.length, type: 'application/pdf' }, exe);
      expect(r.ok, name).toBe(false);
    }
  });

  it('rejects a MIME type that contradicts the extension', () => {
    const r = checkDocument({ name: 'a.pdf', size: pdf.length, type: 'text/html' }, pdf);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('type');
  });

  it('rejects content that does not match the extension (renamed executable)', () => {
    const r = checkDocument({ name: 'a.pdf', size: exe.length, type: 'application/pdf' }, exe);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('content');
    expect(checkDocument({ name: 'a.png', size: jpg.length, type: 'image/png' }, jpg).ok).toBe(false);
    expect(checkDocument({ name: 'a.txt', size: exe.length, type: 'text/plain' }, exe).ok).toBe(false);
    expect(checkDocument({ name: 'a.doc', size: zip.length, type: 'application/msword' }, zip).ok).toBe(false);
  });

  it('rejects empty files and files over 4 MB, with Hebrew messages', () => {
    const empty = checkDocument({ name: 'a.txt', size: 0, type: 'text/plain' }, new Uint8Array(0));
    expect(empty.ok).toBe(false);
    const big = new Uint8Array(MAX_DOCUMENT_BYTES + 1);
    big.set(pdf);
    const tooBig = checkDocument({ name: 'a.pdf', size: big.length, type: 'application/pdf' }, big);
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) {
      expect(tooBig.reason).toBe('size');
      expect(tooBig.message).toMatch(/[\u0590-\u05FF]/);
    }
    const exactly = new Uint8Array(MAX_DOCUMENT_BYTES);
    exactly.set(pdf);
    expect(checkDocument({ name: 'a.pdf', size: exactly.length, type: 'application/pdf' }, exactly).ok).toBe(true);
  });

  it('metadata check (client side) enforces size and type without the bytes', () => {
    expect(checkDocumentMeta({ name: 'a.pdf', size: MAX_DOCUMENT_BYTES + 1, type: 'application/pdf' }).ok).toBe(false);
    expect(checkDocumentMeta({ name: 'a.exe', size: 10, type: 'application/x-msdownload' }).ok).toBe(false);
    expect(checkDocumentMeta({ name: 'a.pdf', size: 10, type: 'application/pdf' }).ok).toBe(true);
  });
});

describe('helpers', () => {
  it('sanitizeFileName strips paths and control characters and bounds the length', () => {
    expect(sanitizeFileName('../../etc/passwd.txt')).toBe('passwd.txt');
    expect(sanitizeFileName('C:\\temp\\scan.pdf')).toBe('scan.pdf');
    expect(sanitizeFileName('a\u0000b\nc.pdf')).toBe('a_b_c.pdf');
    const long = sanitizeFileName('x'.repeat(500) + '.pdf');
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith('.pdf')).toBe(true);
  });

  it('text detection rejects NUL bytes and invalid UTF-8', () => {
    expect(matchesMagicBytes('txt', bytes(0x61, 0x00, 0x62))).toBe(false);
    expect(matchesMagicBytes('txt', bytes(0xff, 0xfe, 0xfd))).toBe(false);
    expect(matchesMagicBytes('txt', txt)).toBe(true);
  });
});
