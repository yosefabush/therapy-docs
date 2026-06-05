import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { userRepository } from '@/lib/data/repositories';
import { logger } from '@/lib/logger';

// Returns the authenticated user, derived from the verified session cookie
// (never from client-supplied input).
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await userRepository.findById(session.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        therapistRole: user.therapistRole,
        organization: user.organization,
      },
    });
  } catch (error) {
    logger.error('Error fetching current user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
