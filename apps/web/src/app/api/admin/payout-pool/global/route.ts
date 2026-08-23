import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    global_pool: 50000,
    merchant_assignments: [
      { merchant_id: 'm-001', percentage: 40, amount: 20000 },
      { merchant_id: 'm-002', percentage: 30, amount: 15000 },
      { merchant_id: 'm-003', percentage: 30, amount: 15000 },
    ],
  });
}
