import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    items: [
      { id: 'rg-001', name: 'RUB Personal', is_root: true, child_count: 2, created_at: '2024-01-15T10:00:00Z' },
    ],
    total: 1,
  });
}
