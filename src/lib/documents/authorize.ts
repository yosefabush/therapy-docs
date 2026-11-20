import { NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { getSession, isAdmin, type SessionPayload } from '@/lib/auth/authz';

/**
 * Same access rule as the patient record itself: only a therapist assigned to
 * the patient, or an admin. 401 unauthenticated, 404 unknown patient, 403
 * not assigned.
 */
export async function authorizeDocumentAccess(
  patientId: string
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const patient = await patientRepository.findById(patientId);
  if (!patient) {
    return { error: NextResponse.json({ error: 'Patient not found' }, { status: 404 }) };
  }
  if (!isAdmin(session) && !patient.assignedTherapists.includes(session.sub)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
}
