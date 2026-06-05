import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
} from '@/lib/auth/authz';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { Report } from '@/types';

async function authorizeReport(
  id: string
): Promise<{ report: Report; userId: string } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) return { error: unauthorized() };

  const report = await reportRepository.findById(id);
  if (!report) return { error: notFound('Report not found') };

  if (!(await canAccessPatient(session, report.patientId))) {
    return { error: forbidden() };
  }
  return { report, userId: session.sub };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeReport(id);
    if ('error' in result) return result.error;

    await recordAudit({
      userId: result.userId,
      action: 'read',
      resourceType: 'report',
      resourceId: id,
    });

    return NextResponse.json({ data: result.report });
  } catch (error) {
    logger.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeReport(id);
    if ('error' in result) return result.error;

    const body = await request.json();
    const report = await reportRepository.update(id, body);

    return NextResponse.json({ data: report });
  } catch (error) {
    logger.error('Error updating report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeReport(id);
    if ('error' in result) return result.error;

    const deleted = await reportRepository.delete(id);

    await recordAudit({
      userId: result.userId,
      action: 'delete',
      resourceType: 'report',
      resourceId: id,
    });

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
