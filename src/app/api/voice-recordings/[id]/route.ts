import { NextRequest, NextResponse } from 'next/server';
import { voiceRecordingRepository } from '@/lib/data/repositories';
import {
  getSession,
  canAccessPatient,
  unauthorized,
  forbidden,
  notFound,
} from '@/lib/auth/authz';
import { recordAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { VoiceRecording } from '@/types';

async function authorizeRecording(
  id: string
): Promise<{ recording: VoiceRecording; userId: string } | { error: NextResponse }> {
  const session = await getSession();
  if (!session) return { error: unauthorized() };

  const recording = await voiceRecordingRepository.findById(id);
  if (!recording) return { error: notFound('Voice recording not found') };

  if (!(await canAccessPatient(session, recording.patientId))) {
    return { error: forbidden() };
  }
  return { recording, userId: session.sub };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeRecording(id);
    if ('error' in result) return result.error;

    await recordAudit({
      userId: result.userId,
      action: 'read',
      resourceType: 'voice_recording',
      resourceId: id,
    });

    return NextResponse.json({ data: result.recording });
  } catch (error) {
    logger.error('Error fetching voice recording:', error);
    return NextResponse.json({ error: 'Failed to fetch voice recording' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeRecording(id);
    if ('error' in result) return result.error;

    const body = await request.json();
    const recording = await voiceRecordingRepository.update(id, body);

    return NextResponse.json({ data: recording });
  } catch (error) {
    logger.error('Error updating voice recording:', error);
    return NextResponse.json({ error: 'Failed to update voice recording' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await authorizeRecording(id);
    if ('error' in result) return result.error;

    const deleted = await voiceRecordingRepository.delete(id);

    await recordAudit({
      userId: result.userId,
      action: 'delete',
      resourceType: 'voice_recording',
      resourceId: id,
    });

    return NextResponse.json({ success: deleted });
  } catch (error) {
    logger.error('Error deleting voice recording:', error);
    return NextResponse.json({ error: 'Failed to delete voice recording' }, { status: 500 });
  }
}
