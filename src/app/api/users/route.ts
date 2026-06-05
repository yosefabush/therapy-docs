import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';
import { logger } from '@/lib/logger';

// Directory listing used by the UI to resolve therapist ids to display names.
// Only non-sensitive fields are returned — never email or license number.
export async function GET() {
  try {
    await seedIfEmpty(); // Auto-seed on first request
    const users = await userRepository.findAll();
    const directory = users.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      therapistRole: u.therapistRole,
      organization: u.organization,
    }));
    return NextResponse.json({ data: directory });
  } catch (error) {
    logger.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
