import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    total_volume: 45000,
    total_orders: 150,
    success_rate: 97.5,
    avg_processing_time_sec: 35,
    revenue: 1250.5,
  });
}
