import { NextRequest, NextResponse } from 'next/server';
import { voiceRecordingRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import {
  getSession,
  canAccessPatient,
  filterByPatientAccess,
  unauthorized,
  forbidden,
} from '@/lib/auth/authz';
import { logger } from '@/lib/logger';
import { sessionRepository } from '@/lib/data/repositories';
import { createRecordingSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { checkAudioDataUrl } from '@/lib/recordings/validate-audio';
import { recordAudit } from '@/lib/audit';

// Vercel rejects bodies above 4.5 MB; refuse anything clearly larger up front
// instead of buffering it.
const MAX_BODY_BYTES = 4.5 * 1024 * 1024;

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const patientId = searchParams.get('patientId');

    let recordings;
    if (patientId) {
      if (!(await canAccessPatient(session, patientId))) return forbidden();
      recordings = await voiceRecordingRepository.findByPatient(patientId);
    } else if (sessionId) {
      // Recordings carry patientId; filter to those the caller may access.
      recordings = await filterByPatientAccess(
        session,
        await voiceRecordingRepository.findBySession(sessionId)
      );
    } else {
      recordings = await filterByPatientAccess(
        session,
        await voiceRecordingRepository.findAll()
      );
    }

    return NextResponse.json({ data: recordings });
  } catch (error) {
    logger.error('Error fetching voice recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch voice recordings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'ההקלטה גדולה מדי (מעל 4MB)', code: 'RECORDING_TOO_LARGE' },
        { status: 413 }
      );
    }

    const parsed = await parseJsonBody(request, createRecordingSchema);
    if ('error' in parsed) return parsed.error;
    const validatedData = parsed.data;

    const audio = checkAudioDataUrl(validatedData.encryptedAudioUrl);
    if (!audio.ok) {
      return NextResponse.json(
        {
          error: audio.message,
          code: audio.reason === 'size' ? 'RECORDING_TOO_LARGE' : 'RECORDING_BAD_TYPE',
        },
        { status: audio.reason === 'size' ? 413 : 400 }
      );
    }

    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }
    // The session must exist and belong to the patient the recording is for.
    const owningSession = await sessionRepository.findById(validatedData.sessionId);
    if (!owningSession || owningSession.patientId !== validatedData.patientId) {
      return NextResponse.json(
        { error: 'Session does not belong to this patient' },
        { status: 400 }
      );
    }

    const recording = await voiceRecordingRepository.create(validatedData);
    await recordAudit({
      userId: session.sub,
      action: 'create',
      resourceType: 'voice_recording',
      resourceId: recording.id,
    });
    return NextResponse.json({ data: recording }, { status: 201 });
  } catch (error) {
    logger.error('Error creating voice recording:', error);
    return NextResponse.json({ error: 'Failed to create voice recording' }, { status: 500 });
  }
}
