import { NextRequest, NextResponse } from 'next/server';
import { patientDocumentRepository } from '@/lib/data/repositories';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { authorizeDocumentAccess } from '@/lib/documents/authorize';
import { DOCUMENT_TYPES, getExtension } from '@/lib/documents/validate';

// The document must exist AND belong to the patient in the URL, so an id from
// one patient can never be fetched through another patient's path.
async function loadDocument(patientId: string, docId: string) {
  const doc = await patientDocumentRepository.findById(docId);
  return doc && doc.patientId === patientId ? doc : null;
}

// RFC 5987 filename*= for Hebrew names, plus an ASCII fallback.
function contentDisposition(disposition: 'attachment' | 'inline', name: string): string {
  const fallback = name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'document';
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const auth = await authorizeDocumentAccess(id);
    if ('error' in auth) return auth.error;

    const doc = await loadDocument(id, docId);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const bytes = await patientDocumentRepository.readContent(docId);
    if (!bytes) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // ?inline=1 opens the file in the browser, but only for types a browser
    // renders safely (never HTML/SVG; types are fixed by the upload allow-list).
    const type = DOCUMENT_TYPES[getExtension(doc.name)];
    const inline =
      request.nextUrl.searchParams.get('inline') === '1' && Boolean(type?.inlineViewable);

    await recordAudit({
      userId: auth.session.sub,
      action: 'read',
      resourceType: 'patient_document',
      resourceId: docId,
      details: `${inline ? 'view' : 'download'} patient=${id}`,
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType === 'text/plain' ? 'text/plain; charset=utf-8' : doc.mimeType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': contentDisposition(inline ? 'inline' : 'attachment', doc.name),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    logger.error('Error downloading document:', error);
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id, docId } = await params;
    const auth = await authorizeDocumentAccess(id);
    if ('error' in auth) return auth.error;

    const doc = await loadDocument(id, docId);
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const deleted = await patientDocumentRepository.delete(docId);

    await recordAudit({
      userId: auth.session.sub,
      action: 'delete',
      resourceType: 'patient_document',
      resourceId: docId,
      details: `delete patient=${id}`,
    });

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting document:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
