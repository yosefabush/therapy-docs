import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
} from '@/lib/auth/authz';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { Session } from '@/types';

// Load the session and verify the caller may access its patient.
async function authorizeSession(
  id: string
): Promise<{ session: Session } | { error: NextResponse }> {
  const auth = await getSession();
  if (!auth) return { error: unauthorized() };

  const session = await sessionRepository.findById(id);
  if (!session) return { error: notFound('Session not found') };

  if (!(await canAccessPatient(auth, session.patientId))) {
    return { error: forbidden() };
  }
  return { session };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeSession(id);
    if ('error' in result) return result.error;

    return NextResponse.json({ data: result.session });
  } catch (error) {
    logger.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeSession(id);
    if ('error' in result) return result.error;

    const body = await request.json();
    const updated = await sessionRepository.update(id, body);

    await recordAudit({
      userId: result.session.therapistId,
      action: 'update',
      resourceType: 'session',
      resourceId: id,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    logger.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeSession(id);
    if ('error' in result) return result.error;

    const deleted = await sessionRepository.delete(id);

    await recordAudit({
      userId: result.session.therapistId,
      action: 'delete',
      resourceType: 'session',
      resourceId: id,
    });

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
