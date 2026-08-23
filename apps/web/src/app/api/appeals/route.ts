import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'current';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  return NextResponse.json({
    items: tab === 'current'
      ? [
          { id: 'app-001', order_id: 'ord-001', reason: 'Payment not received', status: 'OPEN', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'app-002', order_id: 'ord-002', reason: 'Wrong amount', status: 'IN_PROGRESS', created_at: new Date(Date.now() - 172800000).toISOString() },
        ]
      : [
          { id: 'app-003', order_id: 'ord-003', reason: 'Resolved', status: 'RESOLVED', created_at: new Date(Date.now() - 259200000).toISOString() },
        ],
    total: tab === 'current' ? 2 : 1,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const { id, resolution } = (await request.json()) as { id: string; resolution?: string };
  return NextResponse.json({ id, status: 'RESOLVED', resolution });
}
