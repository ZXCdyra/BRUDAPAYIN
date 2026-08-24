import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const list = searchParams.get('list');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const status = searchParams.get('status') || undefined;

  // Simulate fetching orders
  const allOrders = [
    {
      id: 'ord-p001',
      amount: 5000,
      currency: 'RUB',
      status: 'PENDING',
      created_at: new Date(Date.now() - 600000).toISOString(),
      autoclose_at: Math.floor(Date.now() / 1000) + 1800,
    },
    {
      id: 'ord-p002',
      amount: 12000,
      currency: 'RUB',
      status: 'NEW',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      autoclose_at: Math.floor(Date.now() / 1000) + 3600,
    },
    {
      id: 'ord-p003',
      amount: 8500,
      currency: 'RUB',
      status: 'VERIFIED',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      autoclose_at: Math.floor(Date.now() / 1000) + 5400,
    },
  ];

  let filtered = allOrders;
  if (status) {
    filtered = filtered.filter((o) => o.status === status);
  }
  if (list === 'history') {
    filtered = filtered.filter((o) => ['PAID', 'CANCELED', 'UNDERPAID', 'OVERPAID'].includes(o.status));
  } else {
    filtered = filtered.filter((o) => !['PAID', 'CANCELED', 'UNDERPAID', 'OVERPAID'].includes(o.status));
  }

  return NextResponse.json({
    items: filtered,
    total: filtered.length,
    page,
    limit,
  });
}

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params?.orderId;
    const body = await request.json();
    const { orderId: bodyOrderId, actualAmount } = body;

    // Simulate confirming an order as completed
    const updatedOrder = {
      id: orderId || bodyOrderId,
      status: 'PAID',
      actual_amount: actualAmount,
      confirmed_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to confirm order' },
      { status: 500 }
    );
  }
}
