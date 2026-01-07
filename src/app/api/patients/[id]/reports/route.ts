import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reports = await reportRepository.findByPatient(id);
    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
