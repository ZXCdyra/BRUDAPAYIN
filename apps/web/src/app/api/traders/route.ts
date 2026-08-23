import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'tr-001', login: 'trader1', email: null, role: 'TRADER', active: true, created_at: '2024-01-15T10:00:00Z' },
      { id: 'tr-002', login: 'trader2', email: null, role: 'TRADER', active: true, created_at: '2024-02-20T14:00:00Z' },
    ],
    total: 2,
  });
}
