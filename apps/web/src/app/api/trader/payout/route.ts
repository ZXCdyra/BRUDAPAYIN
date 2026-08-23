import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  return NextResponse.json({
    items: [
      { id: 'ord-o001', amount: 300, currency: 'USD', status: 'COMPLETED', created_at: new Date(Date.now() - 7200000).toISOString() },
      { id: 'ord-o002', amount: 750, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    total: 2,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({
    id: `ord-${Date.now()}`,
    status: 'PENDING',
    ...body,
  });
}
