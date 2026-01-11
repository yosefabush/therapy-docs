import { NextRequest, NextResponse } from 'next/server';
import { voiceRecordingRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const patientId = searchParams.get('patientId');

    let recordings;
    if (sessionId) {
      recordings = await voiceRecordingRepository.findBySession(sessionId);
    } else if (patientId) {
      recordings = await voiceRecordingRepository.findByPatient(patientId);
    } else {
      recordings = await voiceRecordingRepository.findAll();
    }

    return NextResponse.json({ data: recordings });
  } catch (error) {
    console.error('Error fetching voice recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch voice recordings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRecordingSchema.parse(body);

    const recording = await voiceRecordingRepository.create(validatedData);
    return NextResponse.json({ data: recording }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating voice recording:', error);
    return NextResponse.json({ error: 'Failed to create voice recording' }, { status: 500 });
  }
}
