import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    items: [
      { id: 'req-001', group_id: 'rg-001', method: 'Sberbank', account: '***1234', currency: 'RUB', active: true, created_at: '2024-01-15T10:00:00Z' },
      { id: 'req-002', group_id: 'rg-001', method: 'Tinkoff', account: '***5678', currency: 'RUB', active: true, created_at: '2024-01-16T12:00:00Z' },
    ],
    total: 2,
  });
}
