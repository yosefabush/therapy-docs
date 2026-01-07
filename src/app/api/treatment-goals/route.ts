import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
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
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let goals;
    if (patientId) {
      goals = await treatmentGoalRepository.findByPatient(patientId);
    } else {
      goals = await treatmentGoalRepository.findAll();
    }

    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createGoalSchema.parse(body);

    const goal = await treatmentGoalRepository.create({
      ...validatedData,
      targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : undefined,
    });
    return NextResponse.json({ data: goal }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
