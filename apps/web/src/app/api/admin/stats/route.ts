import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    total_platform_volume: 125430.5,
    total_orders: 1823,
    active_merchants: 23,
    active_traders: 156,
    total_revenue: 3420.8,
    pending_appeals: 4,
    currency: 'USD',
  });
}
