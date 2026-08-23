import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'key-001', name: 'Production Key', prefix: 'pk_live_***', active: true, created_at: '2024-01-15T10:00:00Z' },
    ],
    total: 1,
  });
}
