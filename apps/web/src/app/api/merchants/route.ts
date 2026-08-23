import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'm-001', login: 'merchant1', email: null, active: true, created_at: '2024-01-15T10:00:00Z' },
      { id: 'm-002', login: 'merchant2', email: null, active: true, created_at: '2024-02-20T14:00:00Z' },
    ],
    total: 2,
  });
}
