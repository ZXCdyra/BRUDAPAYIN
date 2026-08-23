import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  return NextResponse.json({
    balances: [
      { currency: 'USD', available: 1250.75, pending: 50.0, locked: 0 },
      { currency: 'EUR', available: 340.2, pending: 10.0, locked: 0 },
      { currency: 'USDT', available: 500.0, pending: 0, locked: 0 },
    ],
  });
}
