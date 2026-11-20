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
import { createSessionSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { recordAudit } from '@/lib/audit';

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

    const parsed = await parseJsonBody(request, createSessionSchema);
    if ('error' in parsed) return parsed.error;
    const validatedData = parsed.data;

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
    await recordAudit({
      userId: session.sub,
      action: 'create',
      resourceType: 'session',
      resourceId: created.id,
    });
    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    logger.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
