import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { getSession, isAdmin } from '@/lib/auth/session';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const createPatientSchema = z.object({
  idNumber: z.string().length(9, 'תעודת זהות חייבת להכיל 9 ספרות'),
  encryptedData: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  primaryDiagnosis: z.string().optional(),
  referralSource: z.string().optional(),
  insuranceProvider: z.string().optional(),
  assignedTherapists: z.array(z.string()).min(1),
  status: z.enum(['active', 'inactive', 'discharged']).default('active'),
});

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

    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    // A non-admin must include themselves among the assigned therapists; they
    // cannot create a record they would not be able to access.
    if (
      !isAdmin(session) &&
      !validatedData.assignedTherapists.includes(session.sub)
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    logger.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
