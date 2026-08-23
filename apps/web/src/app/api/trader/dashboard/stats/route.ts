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

  // Generate mock dashboard stats
  const stats = {
    total_volume: 125430.5,
    orders_today: 47,
    success_rate: 94.7,
    active_requisites: 5,
    currency: 'USD',
    accepting_orders: true,
    account_active: true,
  };

  return NextResponse.json(stats);
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
