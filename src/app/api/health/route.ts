import { NextResponse } from 'next/server';

// Lightweight liveness/readiness probe for load balancers and uptime monitors.
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
