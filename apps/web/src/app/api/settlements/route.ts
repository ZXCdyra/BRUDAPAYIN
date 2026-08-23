import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    settlements: [
      { id: 'set-001', amount: 1000, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'set-002', amount: 500, currency: 'USD', status: 'COMPLETED', created_at: new Date(Date.now() - 172800000).toISOString() },
    ],
    total: 2,
  });
}
