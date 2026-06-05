import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import {
  getSession,
  isAdmin,
  canAccessPatient,
  unauthorized,
  forbidden,
} from '@/lib/auth/authz';
import { logger } from '@/lib/logger';
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
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let sessions;
    if (patientId) {
      if (!(await canAccessPatient(session, patientId))) return forbidden();
      sessions = await sessionRepository.findByPatient(patientId);
    } else if (isAdmin(session)) {
      sessions = await sessionRepository.findAll();
    } else {
      // A therapist sees the sessions they conduct (identity from the session,
      // never from a client-supplied therapistId).
      sessions = await sessionRepository.findByTherapist(session.sub);
    }

    return NextResponse.json({ data: sessions });
  } catch (error) {
    logger.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const validatedData = createSessionSchema.parse(body);

    // A therapist can only create sessions for themselves and for patients they
    // are assigned to.
    if (!isAdmin(session) && validatedData.therapistId !== session.sub) {
      return forbidden();
    }
    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }

    const created = await sessionRepository.create({
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
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
