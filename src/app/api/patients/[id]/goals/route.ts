import { NextRequest, NextResponse } from 'next/server';
import { treatmentGoalRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const goals = await treatmentGoalRepository.findByPatient(id);
    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}
