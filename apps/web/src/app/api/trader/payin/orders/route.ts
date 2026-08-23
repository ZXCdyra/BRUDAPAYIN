import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  return NextResponse.json({
    items: [
      { id: 'ord-p001', amount: 500, currency: 'USD', status: 'PENDING', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'ord-p002', amount: 1200, currency: 'USD', status: 'COMPLETED', created_at: new Date(Date.now() - 3600000).toISOString() },
    ],
    total: 2,
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true });
}
