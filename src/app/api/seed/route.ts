import { NextResponse } from 'next/server';
import { seedIfEmpty, resetData } from '@/lib/data/seed';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === 'true';

    if (reset) {
      await resetData();
      return NextResponse.json({ message: 'Data reset successfully' });
    }

    const seeded = await seedIfEmpty();
    return NextResponse.json({
      message: seeded ? 'Data seeded successfully' : 'Data already exists'
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
