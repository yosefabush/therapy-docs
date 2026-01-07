import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/data/repositories';
import { seedIfEmpty } from '@/lib/data/seed';

export async function GET() {
  try {
    await seedIfEmpty(); // Auto-seed on first request
    const users = await userRepository.findAll();
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
