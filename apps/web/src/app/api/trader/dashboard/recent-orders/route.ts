import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  return NextResponse.json({
    items: [
      { id: 'ord-101', amount: 100, currency: 'USD', status: 'COMPLETED', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'ord-102', amount: 250, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 300000).toISOString() },
      { id: 'ord-103', amount: 75, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 120000).toISOString() },
    ],
  });
}
