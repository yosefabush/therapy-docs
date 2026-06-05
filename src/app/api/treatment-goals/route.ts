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
import { z } from 'zod';

const createGoalSchema = z.object({
  patientId: z.string(),
  description: z.string(),
  targetDate: z.string().optional(),
  status: z.enum(['active', 'achieved', 'modified', 'discontinued']).default('active'),
  progress: z.number().min(0).max(100).default(0),
  measurementCriteria: z.string(),
  createdBy: z.string(),
});

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

    const body = await request.json();
    const validatedData = createGoalSchema.parse(body);

    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }

    const goal = await treatmentGoalRepository.create({
      ...validatedData,
      targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined,
    });
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
