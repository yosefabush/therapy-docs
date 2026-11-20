import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { getSession, isAdmin, type SessionPayload } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { updatePatientSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import type { Patient } from '@/types';

// Returns the authorized patient, or a NextResponse describing why access was
// denied (401 unauthenticated, 404 not found, 403 not assigned).
async function authorizePatientAccess(
  id: string
): Promise<
  | { session: SessionPayload; patient: Patient }
  | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const patient = await patientRepository.findById(id);
  if (!patient) {
    return { error: NextResponse.json({ error: 'Patient not found' }, { status: 404 }) };
  }

  if (!isAdmin(session) && !patient.assignedTherapists.includes(session.sub)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session, patient };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizePatientAccess(id);
    if ('error' in auth) return auth.error;

    await recordAudit({
      userId: auth.session.sub,
      action: 'read',
      resourceType: 'patient',
      resourceId: id,
    });

    return NextResponse.json({ data: auth.patient });
  } catch (error) {
    logger.error('Error fetching patient:', error);
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizePatientAccess(id);
    if ('error' in auth) return auth.error;

    const parsed = await parseJsonBody(request, updatePatientSchema);
    if ('error' in parsed) return parsed.error;
    const { assignedTherapists, ...changes } = parsed.data;

    // Only an admin may reassign a patient. Re-sending the current list is a
    // harmless no-op for a therapist; any real change is refused.
    if (assignedTherapists !== undefined && !isAdmin(auth.session)) {
      const current = [...auth.patient.assignedTherapists].sort().join('|');
      const requested = [...assignedTherapists].sort().join('|');
      if (current !== requested) {
        return NextResponse.json(
          { error: 'Only an administrator can change assigned therapists', code: 'ADMIN_ONLY' },
          { status: 403 }
        );
      }
    }

    const patient = await patientRepository.update(
      id,
      isAdmin(auth.session) && assignedTherapists !== undefined
        ? { ...changes, assignedTherapists }
        : changes
    );

    await recordAudit({
      userId: auth.session.sub,
      action: 'update',
      resourceType: 'patient',
      resourceId: id,
    });

    return NextResponse.json({ data: patient });
  } catch (error) {
    logger.error('Error updating patient:', error);
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorizePatientAccess(id);
    if ('error' in auth) return auth.error;

    const deleted = await patientRepository.delete(id);

    await recordAudit({
      userId: auth.session.sub,
      action: 'delete',
      resourceType: 'patient',
      resourceId: id,
    });

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting patient:', error);
    return NextResponse.json({ error: 'Failed to delete patient' }, { status: 500 });
  }
}
