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

  const mockStats = {
    total_volume: 125430.5,
    orders_today: 47,
    orders_total: 1823,
    success_rate: 94.7,
    avg_processing_time_sec: 45,
    active_traders: 156,
    active_merchants: 23,
    total_revenue: 3420.8,
    currency: 'USD',
    period: {
      from: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
    volume_by_day: [
      { date: '2024-01-15', volume: 12500 },
      { date: '2024-01-16', volume: 15800 },
      { date: '2024-01-17', volume: 9200 },
      { date: '2024-01-18', volume: 18400 },
      { date: '2024-01-19', volume: 21000 },
      { date: '2024-01-20', volume: 16700 },
      { date: '2024-01-21', volume: 11830 },
    ],
  };

  return NextResponse.json(mockStats);
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
