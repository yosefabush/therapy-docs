import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createSessionSchema = z.object({
  patientId: z.string(),
  therapistId: z.string(),
  therapistRole: z.enum([
    'psychologist', 'psychiatrist', 'social_worker',
    'occupational_therapist', 'speech_therapist', 'physical_therapist',
    'counselor', 'art_therapist', 'music_therapist', 'family_therapist'
  ]),
  sessionType: z.enum([
    'initial_assessment', 'individual_therapy', 'group_therapy',
    'family_therapy', 'evaluation', 'follow_up',
    'crisis_intervention', 'discharge_planning'
  ]),
  scheduledAt: z.string(),
  duration: z.number().min(15).max(180).default(50),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  location: z.enum(['in_person', 'telehealth', 'home_visit']).default('in_person'),
  notes: z.object({
    chiefComplaint: z.string().optional(),
    subjective: z.string().default(''),
    objective: z.string().default(''),
    assessment: z.string().default(''),
    plan: z.string().default(''),
    interventionsUsed: z.array(z.string()).default([]),
    progressTowardGoals: z.string().optional(),
    homework: z.string().optional(),
    nextSessionPlan: z.string().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const patientId = searchParams.get('patientId');

    let sessions;
    if (therapistId) {
      sessions = await sessionRepository.findByTherapist(therapistId);
    } else if (patientId) {
      sessions = await sessionRepository.findByPatient(patientId);
    } else {
      sessions = await sessionRepository.findAll();
    }

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    const session = await sessionRepository.create({
      ...validatedData,
      scheduledAt: new Date(validatedData.scheduledAt),
      notes: validatedData.notes ?? {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        interventionsUsed: [],
      },
    });
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
