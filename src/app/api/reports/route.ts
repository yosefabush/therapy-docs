import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import {
  getSession,
  canAccessPatient,
  filterByPatientAccess,
  unauthorized,
  forbidden,
} from '@/lib/auth/authz';
import { logger } from '@/lib/logger';
import { createReportSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { recordAudit } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    await seedIfEmpty();
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    let reports;
    if (patientId) {
      if (!(await canAccessPatient(session, patientId))) return forbidden();
      reports = await reportRepository.findByPatient(patientId);
    } else {
      reports = await filterByPatientAccess(
        session,
        await reportRepository.findAll()
      );
    }

    return NextResponse.json({ data: reports });
  } catch (error) {
    logger.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const parsed = await parseJsonBody(request, createReportSchema);
    if ('error' in parsed) return parsed.error;
    const validatedData = parsed.data;

    if (!(await canAccessPatient(session, validatedData.patientId))) {
      return forbidden();
    }

    const report = await reportRepository.create({
      ...validatedData,
      // The author is always the authenticated user, never a client value.
      generatedBy: session.sub,
      dateRange: {
        start: new Date(validatedData.dateRange.start),
        end: new Date(validatedData.dateRange.end),
      },
      generatedAt: new Date(),
    });
    await recordAudit({
      userId: session.sub,
      action: 'create',
      resourceType: 'report',
      resourceId: report.id,
    });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    logger.error('Error creating report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
