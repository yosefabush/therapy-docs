import { NextRequest, NextResponse } from 'next/server';
import { voiceRecordingRepository } from '@/lib/data/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const recording = await voiceRecordingRepository.findById(id);

    if (!recording) {
      return NextResponse.json({ error: 'Voice recording not found' }, { status: 404 });
    }

    return NextResponse.json({ data: recording });
  } catch (error) {
    console.error('Error fetching voice recording:', error);
    return NextResponse.json({ error: 'Failed to fetch voice recording' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const recording = await voiceRecordingRepository.update(id, body);

    if (!recording) {
      return NextResponse.json({ error: 'Voice recording not found' }, { status: 404 });
    }

    return NextResponse.json({ data: recording });
  } catch (error) {
    console.error('Error updating voice recording:', error);
    return NextResponse.json({ error: 'Failed to update voice recording' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await voiceRecordingRepository.delete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Voice recording not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice recording:', error);
    return NextResponse.json({ error: 'Failed to delete voice recording' }, { status: 500 });
  }
}
