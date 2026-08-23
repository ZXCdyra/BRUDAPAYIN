import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';

  return NextResponse.json({
    period,
    total_volume: 98765.4,
    total_orders: 432,
    success_rate: 96.2,
    avg_processing_time_sec: 42,
    volume_by_method: [
      { method: 'SBERBANK', volume: 45000, orders: 150 },
      { method: 'TINKOFF', volume: 32000, orders: 98 },
      { method: 'WISE', volume: 21765.4, orders: 64 },
    ],
    volume_by_currency: [
      { currency: 'RUB', volume: 98765.4, orders: 432 },
    ],
  });
}
