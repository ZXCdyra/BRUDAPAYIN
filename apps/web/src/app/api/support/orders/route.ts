import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'current';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  return NextResponse.json({
    items: tab === 'current'
      ? [
          { id: 'so-001', status: 'OPEN', type: 'PAYIN', amount: 500, created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'so-002', status: 'IN_PROGRESS', type: 'PAYOUT', amount: 1200, created_at: new Date(Date.now() - 172800000).toISOString() },
        ]
      : [
          { id: 'so-003', status: 'RESOLVED', type: 'PAYIN', amount: 750, created_at: new Date(Date.now() - 259200000).toISOString() },
        ],
    total: tab === 'current' ? 2 : 1,
    page,
    limit,
  });
}
