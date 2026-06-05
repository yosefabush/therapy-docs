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
import { z } from 'zod';

const speakerUtteranceSchema = z.object({
  speaker: z.number(),
  speakerLabel: z.string().optional(),
  transcript: z.string(),
  start: z.number(),
  end: z.number(),
  confidence: z.number(),
});

const diarizedTranscriptSchema = z.object({
  utterances: z.array(speakerUtteranceSchema),
  speakerCount: z.number(),
  speakerLabels: z.record(z.string(), z.string()).optional(),
  rawTranscript: z.string(),
});

const createRecordingSchema = z.object({
  sessionId: z.string(),
  patientId: z.string(),
  duration: z.number().min(0),
  encryptedAudioUrl: z.string(),  // Base64 audio data
  transcriptionStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  encryptedTranscript: z.string().optional(),
  diarizedTranscript: diarizedTranscriptSchema.optional(),
  consentObtained: z.boolean(),
});

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

    const body = await request.json();
    const validatedData = createRecordingSchema.parse(body);

    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }

    const recording = await voiceRecordingRepository.create(validatedData);
    return NextResponse.json({ data: recording }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating voice recording:', error);
    return NextResponse.json({ error: 'Failed to create voice recording' }, { status: 500 });
  }
}
