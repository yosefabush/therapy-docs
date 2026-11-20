import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import {
  getSession,
  canAccessPatient,
  filterByPatientAccess,
  unauthorized,
  forbidden,
} from '@/lib/auth/authz';
import { logger } from '@/lib/logger';
import { createGoalSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { recordAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let goals;
    if (patientId) {
      if (!(await canAccessPatient(session, patientId))) return forbidden();
      goals = await treatmentGoalRepository.findByPatient(patientId);
    } else {
      goals = await filterByPatientAccess(
        session,
        await treatmentGoalRepository.findAll()
      );
    }

    return NextResponse.json({ data: goals });
  } catch (error) {
    logger.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const parsed = await parseJsonBody(request, createGoalSchema);
    if ('error' in parsed) return parsed.error;
    const validatedData = parsed.data;

    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }

    const goal = await treatmentGoalRepository.create({
      ...validatedData,
      // The author is the authenticated user, never a client-supplied value.
      createdBy: session.sub,
      targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined,
    });
    await recordAudit({
      userId: session.sub,
      action: 'create',
      resourceType: 'treatment_goal',
      resourceId: goal.id,
    });
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    logger.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
