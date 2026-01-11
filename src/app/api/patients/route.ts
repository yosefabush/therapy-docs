import { NextRequest, NextResponse } from 'next/server';
import { patientRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
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
    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const status = searchParams.get('status');

    let patients;
    if (therapistId) {
      patients = await patientRepository.findByTherapist(therapistId);
    } else if (status) {
      patients = await patientRepository.findByStatus(status as 'active' | 'inactive' | 'discharged');
    } else {
      patients = await patientRepository.findAll();
    }

    return NextResponse.json({ data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPatientSchema.parse(body);

    const patient = await patientRepository.create(validatedData);
    return NextResponse.json({ data: patient }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating patient:', error);
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 });
  }
}
