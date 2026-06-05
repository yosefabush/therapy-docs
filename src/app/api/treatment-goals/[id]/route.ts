import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
} from '@/lib/auth/authz';
import { logger } from '@/lib/logger';
import type { TreatmentGoal } from '@/types';

async function authorizeGoal(
  id: string
): Promise<{ goal: TreatmentGoal } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) return { error: unauthorized() };

  const goal = await treatmentGoalRepository.findById(id);
  if (!goal) return { error: notFound('Goal not found') };

  if (!(await canAccessPatient(session, goal.patientId))) {
    return { error: forbidden() };
  }
  return { goal };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeGoal(id);
    if ('error' in result) return result.error;

    return NextResponse.json({ data: result.goal });
  } catch (error) {
    logger.error('Error fetching goal:', error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeGoal(id);
    if ('error' in result) return result.error;

    const body = await request.json();
    const goal = await treatmentGoalRepository.update(id, body);

    return NextResponse.json({ data: goal });
  } catch (error) {
    logger.error('Error updating goal:', error);
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeGoal(id);
    if ('error' in result) return result.error;

    const deleted = await treatmentGoalRepository.delete(id);

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting goal:', error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
