import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const user = decodeJwtPayload(token);

  if (!user || !(user.login || user.email)) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Invalid token' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const status = searchParams.get('status') || undefined;

  // Generate mock orders
  const allOrders = [
    {
      id: 'ord-001',
      amount: 500,
      currency: 'USD',
      status: 'PENDING',
      type: 'PAYIN',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      trader_id: 'usr-trader-1',
      merchant_id: 'usr-merchant-1',
    },
    {
      id: 'ord-002',
      amount: 1200,
      currency: 'USD',
      status: 'COMPLETED',
      type: 'PAYOUT',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      trader_id: 'usr-trader-1',
      merchant_id: 'usr-merchant-2',
    },
    {
      id: 'ord-003',
      amount: 750,
      currency: 'USD',
      status: 'PENDING',
      type: 'PAYIN',
      created_at: new Date(Date.now() - 10800000).toISOString(),
      trader_id: 'usr-trader-2',
      merchant_id: 'usr-merchant-1',
    },
    {
      id: 'ord-004',
      amount: 300,
      currency: 'USD',
      status: 'COMPLETED',
      type: 'PAYOUT',
      created_at: new Date(Date.now() - 14400000).toISOString(),
      trader_id: 'usr-trader-1',
      merchant_id: 'usr-merchant-3',
    },
    {
      id: 'ord-005',
      amount: 2000,
      currency: 'USD',
      status: 'FAILED',
      type: 'PAYIN',
      created_at: new Date(Date.now() - 18000000).toISOString(),
      trader_id: 'usr-trader-3',
      merchant_id: 'usr-merchant-2',
    },
  ];

  let filtered = allOrders;
  if (status) {
    filtered = allOrders.filter((o) => o.status === status.toUpperCase());
  }

  const totalPages = Math.ceil(filtered.length / limit);
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    items: paginated,
    total: filtered.length,
    page,
    limit,
    totalPages,
  });
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}
