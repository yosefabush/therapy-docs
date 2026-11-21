import { NextRequest, NextResponse } from 'next/server';
import { reportRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  isAdmin,
} from '@/lib/auth/authz';
import { updateReportSchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/parse';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { Report } from '@/types';

async function authorizeReport(
  id: string
): Promise<
  | { report: Report; userId: string; admin: boolean; auth: NonNullable<Awaited<ReturnType<typeof getSession>>> }
  | { error: NextResponse }
> {
  const session = await getSession();
  if (!session) return { error: unauthorized() };

  const report = await reportRepository.findById(id);
  if (!report) return { error: notFound('Report not found') };

  if (!(await canAccessPatient(session, report.patientId))) {
    return { error: forbidden() };
  }
  return { report, userId: session.sub, admin: isAdmin(session), auth: session };
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

    const parsed = await parseJsonBody(request, updateReportSchema);
    if ('error' in parsed) return parsed.error;
    const { patientId, dateRange, status, ...rest } = parsed.data;
    const current = result.report;

    // A signed report is frozen for therapists; an admin override is audited.
    const locked = current.status === 'signed' || Boolean(current.signedAt);
    if (locked && !result.admin) {
      return conflict('הדוח נחתם ולא ניתן לעריכה', 'REPORT_SIGNED');
    }
    if (patientId !== undefined && patientId !== current.patientId) {
      if (!(await canAccessPatient(result.auth, patientId))) return forbidden();
    }

    const changes: Partial<Report> = {
      ...rest,
      ...(patientId !== undefined ? { patientId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(dateRange
        ? { dateRange: { start: new Date(dateRange.start), end: new Date(dateRange.end) } }
        : {}),
    } as Partial<Report>;
    // Signing is stamped by the server from the authenticated user.
    if (status === 'signed' && !locked) {
      changes.signedAt = new Date();
      changes.signedBy = result.userId;
    }
    const report = await reportRepository.update(id, changes);

    await recordAudit({
      userId: result.userId,
      action: 'update',
      resourceType: 'report',
      resourceId: id,
      details: locked ? 'admin override of signed report' : undefined,
    });

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

    // A signed report is frozen for therapists (same rule as editing); an admin may remove it.
    if ((result.report.status === 'signed' || result.report.signedAt) && !result.admin) {
      return conflict('הדוח נחתם ולא ניתן למחיקה', 'REPORT_SIGNED');
    }
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
