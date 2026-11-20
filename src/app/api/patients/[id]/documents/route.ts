import { NextRequest, NextResponse } from 'next/server';
import { patientDocumentRepository } from '@/lib/data/repositories';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { authorizeDocumentAccess } from '@/lib/documents/authorize';
import {
  MAX_DOCUMENT_BYTES,
  DOCUMENT_TOO_LARGE_MESSAGE,
  DOCUMENT_NO_FILE_MESSAGE,
  checkDocument,
} from '@/lib/documents/validate';

// Multipart framing adds a few hundred bytes around the file; allow some slack
// but refuse anything clearly bigger before buffering it.
const MAX_REQUEST_BYTES = MAX_DOCUMENT_BYTES + 64 * 1024;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeDocumentAccess(id);
    if ('error' in auth) return auth.error;

    const documents = await patientDocumentRepository.listByPatient(id);
    return NextResponse.json({ data: documents });
  } catch (error) {
    logger.error('Error listing documents:', error);
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizeDocumentAccess(id);
    if ('error' in auth) return auth.error;

    const tooLarge = () =>
      NextResponse.json(
        { error: DOCUMENT_TOO_LARGE_MESSAGE, code: 'DOCUMENT_TOO_LARGE' },
        { status: 413 }
      );

    if (Number(request.headers.get('content-length') ?? 0) > MAX_REQUEST_BYTES) {
      return tooLarge();
    }
    if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('multipart/form-data')) {
      return NextResponse.json(
        { error: DOCUMENT_NO_FILE_MESSAGE, code: 'DOCUMENT_NO_FILE' },
        { status: 400 }
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: DOCUMENT_NO_FILE_MESSAGE, code: 'DOCUMENT_NO_FILE' },
        { status: 400 }
      );
    }
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: DOCUMENT_NO_FILE_MESSAGE, code: 'DOCUMENT_NO_FILE' },
        { status: 400 }
      );
    }
    if (file.size > MAX_DOCUMENT_BYTES) return tooLarge();

    const bytes = Buffer.from(await file.arrayBuffer());
    const check = checkDocument({ name: file.name, size: bytes.length, type: file.type }, bytes);
    if (!check.ok) {
      const codes = {
        empty: 'DOCUMENT_EMPTY',
        size: 'DOCUMENT_TOO_LARGE',
        type: 'DOCUMENT_BAD_TYPE',
        content: 'DOCUMENT_CONTENT_MISMATCH',
      } as const;
      return NextResponse.json(
        { error: check.message, code: codes[check.reason] },
        { status: check.reason === 'size' ? 413 : 400 }
      );
    }

    const document = await patientDocumentRepository.add({
      patientId: id,
      name: check.fileName,
      // Canonical type by extension: the client-declared MIME is never trusted.
      mimeType: check.type.mime,
      uploadedBy: auth.session.sub,
      bytes,
    });

    // The audit trail records who/what/size, never the file name (it can be PHI).
    await recordAudit({
      userId: auth.session.sub,
      action: 'create',
      resourceType: 'patient_document',
      resourceId: document.id,
      details: `upload patient=${id} type=${check.type.ext} size=${document.size}`,
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    logger.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
