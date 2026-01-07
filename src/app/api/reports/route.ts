import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { z } from 'zod';

const createReportSchema = z.object({
  patientId: z.string(),
  reportType: z.enum([
    'progress_summary', 'discharge_summary', 'insurance_report',
    'referral_report', 'evaluation_report', 'treatment_summary', 'multidisciplinary_summary'
  ]),
  generatedBy: z.string(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  content: z.object({
    summary: z.string(),
    sessionsSummary: z.array(z.any()).default([]),
    goalsProgress: z.array(z.any()).default([]),
    recommendations: z.string().default(''),
    clinicalImpressions: z.string().default(''),
  }),
  status: z.enum(['draft', 'finalized', 'signed']).default('draft'),
});

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let reports;
    if (patientId) {
      reports = await reportRepository.findByPatient(patientId);
    } else {
      reports = await reportRepository.findAll();
    }

    return NextResponse.json({ data: reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    const report = await reportRepository.create({
      ...validatedData,
      dateRange: {
        start: new Date(validatedData.dateRange.start),
        end: new Date(validatedData.dateRange.end),
      },
      generatedAt: new Date(),
    });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
