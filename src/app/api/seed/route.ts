import { NextResponse } from 'next/server';
import { seedIfEmpty, resetData } from '@/lib/data/seed';
import { getSession, isAdmin } from '@/lib/auth/session';
import { IS_PRODUCTION } from '@/lib/env';
import { logger } from '@/lib/logger';

// Manual seeding endpoint. Not used by the app itself (data routes and the
// Docker entrypoint seed an empty store automatically), so it is restricted to
// admins, and the destructive reset remains development-only.
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      // Destructive reset is a development-only convenience. Never allow it to
      // wipe data in production.
      if (IS_PRODUCTION) {
        return NextResponse.json(
          { error: 'Data reset is disabled in production' },
          { status: 403 }
        );
      }
      await resetData();
      return NextResponse.json({ message: 'Data reset successfully' });
    }

    const seeded = await seedIfEmpty();
    return NextResponse.json({
      message: seeded ? 'Data seeded successfully' : 'Data already exists'
    });
  } catch (error) {
    logger.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
