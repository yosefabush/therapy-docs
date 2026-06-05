import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';
import { getSession, isAdmin, unauthorized, forbidden } from '@/lib/auth/authz';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return unauthorized();

    // A therapist may only read their own full record; admins may read any.
    if (!isAdmin(session) && session.sub !== id) {
      return forbidden();
    }

    const user = await userRepository.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    logger.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
