import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    total_volume: 98765.4,
    total_orders: 432,
    success_rate: 98.1,
    currency: 'USD',
  });
}
