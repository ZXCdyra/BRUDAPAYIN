import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;

  let items = [
    { id: 'ord-001', type: 'PAYIN', amount: 500, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'ord-002', type: 'PAYOUT', amount: 1200, currency: 'USD', status: 'COMPLETED', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'ord-003', type: 'PAYIN', amount: 750, currency: 'USD', status: 'FAILED', created_at: new Date(Date.now() - 10800000).toISOString() },
  ];

  if (status) items = items.filter((i) => i.status === status);
  if (type) items = items.filter((i) => i.type === type);

  return NextResponse.json({
    items,
    total: items.length,
    page,
    limit,
  });
}
