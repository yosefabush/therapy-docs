import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { getSession, isAdmin } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { createPatientSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();

    // Authorization is derived from the verified session, never from the
    // client-supplied therapistId query parameter.
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let patients;
    if (isAdmin(session)) {
      patients = status
        ? await patientRepository.findByStatus(
            status as 'active' | 'inactive' | 'discharged'
          )
        : await patientRepository.findAll();
    } else {
      // Non-admins can only ever see patients assigned to themselves.
      patients = await patientRepository.findByTherapist(session.sub);
      if (status) {
        patients = patients.filter((p) => p.status === status);
      }
    }

    await recordAudit({
      userId: session.sub,
      action: 'list',
      resourceType: 'patient',
      resourceId: '*',
    });

    return NextResponse.json({ data: patients });
  } catch (error) {
    logger.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, createPatientSchema);
    if ('error' in parsed) return parsed.error;
    const validatedData = parsed.data;

    // Only an admin may assign a patient to other therapists. A therapist
    // creates a patient assigned to themselves and nobody else.
    if (
      !isAdmin(session) &&
      !(
        validatedData.assignedTherapists.length === 1 &&
        validatedData.assignedTherapists[0] === session.sub
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const patient = await patientRepository.create(validatedData);

    await recordAudit({
      userId: session.sub,
      action: 'create',
      resourceType: 'patient',
      resourceId: patient.id,
    });

    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    logger.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
