import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'wh-001', url: 'https://example.com/webhook', events: ['order.completed'], active: true, created_at: '2024-01-15T10:00:00Z' },
    ],
    total: 1,
  });
}
