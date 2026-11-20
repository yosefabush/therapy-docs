import { NextResponse } from 'next/server';
import { getSession, unauthorized } from '@/lib/auth/authz';
import { isTranscriptionConfigured } from '@/lib/transcription-config';

// Tells the UI whether automatic transcription is available, so it can hide
// the button instead of letting the user hit an error. Never returns the key.
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();
  return NextResponse.json({ data: { enabled: isTranscriptionConfigured() } });
}
