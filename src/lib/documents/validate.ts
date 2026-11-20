// Shared (client + server) rules for patient document uploads.
//
// The upload is multipart (not base64 JSON) so a 4 MB file stays under the
// 4.5 MB request-body limit of the hosting platform. The server re-checks
// everything: extension allow-list, declared MIME type and the file's magic
// bytes. Pure functions only, so they can run in the browser too.

export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const DOCUMENT_TOO_LARGE_MESSAGE = 'הקובץ גדול מדי. הגודל המרבי למסמך הוא 4MB.';
export const DOCUMENT_BAD_TYPE_MESSAGE =
  'סוג הקובץ אינו נתמך. ניתן להעלות קבצי PDF, PNG, JPG, DOCX, DOC או TXT בלבד.';
export const DOCUMENT_EMPTY_MESSAGE = 'הקובץ ריק.';
export const DOCUMENT_CONTENT_MISMATCH_MESSAGE =
  'תוכן הקובץ אינו תואם לסוג שלו. ודאו שהקובץ תקין ונסו שוב.';
export const DOCUMENT_NO_FILE_MESSAGE = 'לא נבחר קובץ להעלאה.';

export interface DocumentType {
  ext: string;
  mime: string;
  /** MIME types browsers may report for this extension. */
  acceptedMimes: string[];
  /** Whether a browser can render it inline (view in a new tab). */
  inlineViewable: boolean;
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const DOCUMENT_TYPES: Record<string, DocumentType> = {
  pdf: { ext: 'pdf', mime: 'application/pdf', acceptedMimes: ['application/pdf'], inlineViewable: true },
  png: { ext: 'png', mime: 'image/png', acceptedMimes: ['image/png'], inlineViewable: true },
  jpg: { ext: 'jpg', mime: 'image/jpeg', acceptedMimes: ['image/jpeg', 'image/jpg', 'image/pjpeg'], inlineViewable: true },
  jpeg: { ext: 'jpeg', mime: 'image/jpeg', acceptedMimes: ['image/jpeg', 'image/jpg', 'image/pjpeg'], inlineViewable: true },
  docx: { ext: 'docx', mime: DOCX_MIME, acceptedMimes: [DOCX_MIME], inlineViewable: false },
  doc: { ext: 'doc', mime: 'application/msword', acceptedMimes: ['application/msword'], inlineViewable: false },
  txt: { ext: 'txt', mime: 'text/plain', acceptedMimes: ['text/plain'], inlineViewable: true },
};

/** Value for <input type="file" accept="...">. */
export const DOCUMENT_ACCEPT_ATTR = Object.keys(DOCUMENT_TYPES)
  .map((e) => `.${e}`)
  .join(',');

// Browsers sometimes cannot classify a file (e.g. .docx on some systems) and
// report one of these; the magic bytes then decide.
const GENERIC_MIMES = new Set(['', 'application/octet-stream']);

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx < 0 ? '' : fileName.slice(idx + 1).toLowerCase();
}

/** A safe display/storage name: no path, no control characters, bounded length. */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[\u0000-\u001f\u007f"<>|:*?]/g, '_').trim();
  if (cleaned.length <= 200) return cleaned;
  const ext = getExtension(cleaned);
  return cleaned.slice(0, 200 - (ext ? ext.length + 1 : 0)) + (ext ? `.${ext}` : '');
}

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return bytes.length >= magic.length && magic.every((b, i) => bytes[i] === b);
}

function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** Does the content really look like the claimed extension? */
export function matchesMagicBytes(ext: string, bytes: Uint8Array): boolean {
  switch (ext) {
    case 'pdf':
      // The header may be preceded by a little junk, but must be in the first 1 KB.
      return new TextDecoder('latin1').decode(bytes.subarray(0, 1024)).includes('%PDF-');
    case 'png':
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'jpg':
    case 'jpeg':
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case 'docx':
      return startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]); // ZIP container
    case 'doc':
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]); // OLE2
    case 'txt':
      return looksLikeText(bytes);
    default:
      return false;
  }
}

export type DocumentCheck =
  | { ok: true; type: DocumentType; fileName: string }
  | { ok: false; reason: 'empty' | 'size' | 'type' | 'content'; message: string };

/** Metadata-only check (no bytes): usable in the browser before uploading. */
export function checkDocumentMeta(file: { name: string; size: number; type: string }): DocumentCheck {
  const fileName = sanitizeFileName(file.name);
  const type = DOCUMENT_TYPES[getExtension(fileName)];
  if (!fileName || !type) {
    return { ok: false, reason: 'type', message: DOCUMENT_BAD_TYPE_MESSAGE };
  }
  const mime = (file.type || '').split(';')[0].trim().toLowerCase();
  if (!GENERIC_MIMES.has(mime) && !type.acceptedMimes.includes(mime)) {
    return { ok: false, reason: 'type', message: DOCUMENT_BAD_TYPE_MESSAGE };
  }
  if (file.size <= 0) return { ok: false, reason: 'empty', message: DOCUMENT_EMPTY_MESSAGE };
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { ok: false, reason: 'size', message: DOCUMENT_TOO_LARGE_MESSAGE };
  }
  return { ok: true, type, fileName };
}

/** Full server-side check: metadata plus the real bytes. */
export function checkDocument(
  file: { name: string; size: number; type: string },
  bytes: Uint8Array
): DocumentCheck {
  const meta = checkDocumentMeta({ ...file, size: bytes.length });
  if (!meta.ok) return meta;
  if (!matchesMagicBytes(meta.type.ext, bytes)) {
    return { ok: false, reason: 'content', message: DOCUMENT_CONTENT_MISMATCH_MESSAGE };
  }
  return meta;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
