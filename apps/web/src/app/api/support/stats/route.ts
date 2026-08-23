import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    open_disputes: 4,
    resolved_today: 2,
    avg_resolution_time_hours: 6.5,
  });
}
