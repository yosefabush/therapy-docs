import { NextResponse } from 'next/server';
import { seedIfEmpty, resetData } from '@/lib/data/seed';
import { IS_PRODUCTION } from '@/lib/env';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
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
