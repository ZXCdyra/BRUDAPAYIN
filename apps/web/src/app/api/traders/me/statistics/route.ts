import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    total_volume: 98765.4,
    total_orders: 432,
    avg_success_rate: 96.2,
    total_revenue: 2345.6,
    period: '7d',
  });
}
