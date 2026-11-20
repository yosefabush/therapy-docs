import { NextRequest, NextResponse } from 'next/server';
import { sessionRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  isAdmin,
} from '@/lib/auth/authz';
import { updateSessionSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { Session } from '@/types';

// Load the session and verify the caller may access its patient.
async function authorizeSession(
  id: string
): Promise<{ session: Session; userId: string; admin: boolean; auth: NonNullable<Awaited<ReturnType<typeof getSession>>> } | { error: NextResponse }> {
  const auth = await getSession();
  if (!auth) return { error: unauthorized() };

  const session = await sessionRepository.findById(id);
  if (!session) return { error: notFound('Session not found') };

  if (!(await canAccessPatient(auth, session.patientId))) {
    return { error: forbidden() };
  }
  return { session, userId: auth.sub, admin: isAdmin(auth), auth };
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

    const parsed = await parseJsonBody(request, updateSessionSchema);
    if ('error' in parsed) return parsed.error;
    const { signedAt: signal, therapistId, patientId, ...rest } = parsed.data;
    const current = result.session;

    // A signed session is a legal clinical record: frozen for therapists. An
    // administrator can still correct it; that override is audited.
    const locked = Boolean(current.signedAt);
    if (locked && !result.admin) {
      return conflict('המפגש נחתם ולא ניתן לעריכה', 'SESSION_SIGNED');
    }
    // A completed session cannot be re-opened by a therapist.
    if (
      current.status === 'completed' &&
      rest.status !== undefined &&
      rest.status !== 'completed' &&
      !result.admin
    ) {
      return conflict('לא ניתן לשנות את סטטוס מפגש שהושלם', 'SESSION_COMPLETED');
    }

    // Ownership: only an admin may hand a session to another therapist, and a
    // session can only be moved onto a patient the caller may access.
    if (therapistId !== undefined && therapistId !== current.therapistId && !result.admin) {
      return forbidden();
    }
    if (patientId !== undefined && patientId !== current.patientId) {
      if (!(await canAccessPatient(result.auth, patientId))) return forbidden();
    }

    const changes: Partial<Session> = {
      ...rest,
      ...(therapistId !== undefined ? { therapistId } : {}),
      ...(patientId !== undefined ? { patientId } : {}),
      ...(rest.scheduledAt !== undefined ? { scheduledAt: new Date(rest.scheduledAt) } : {}),
      ...(rest.startedAt !== undefined ? { startedAt: new Date(rest.startedAt) } : {}),
      ...(rest.endedAt !== undefined ? { endedAt: new Date(rest.endedAt) } : {}),
    } as Partial<Session>;
    // Signing: the client only signals intent (signedAt present); the server
    // stamps the time and the signer from the authenticated session.
    if (signal && !locked) {
      changes.signedAt = new Date();
      changes.signedBy = result.userId;
    }
    const updated = await sessionRepository.update(id, changes);

    await recordAudit({
      userId: result.userId,
      action: 'update',
      resourceType: 'session',
      resourceId: id,
      details: locked ? 'admin override of signed session' : undefined,
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

    if (result.session.signedAt && !result.admin) {
      return conflict('המפגש נחתם ולא ניתן למחיקה', 'SESSION_SIGNED');
    }
    const deleted = await sessionRepository.delete(id);

    await recordAudit({
      userId: result.userId,
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
