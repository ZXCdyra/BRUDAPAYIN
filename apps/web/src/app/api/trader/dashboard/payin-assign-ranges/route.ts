import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    ranges: [
      { min_amount: 0, max_amount: 100, fee_percent: 2.5 },
      { min_amount: 100, max_amount: 500, fee_percent: 2.0 },
      { min_amount: 500, max_amount: 1000, fee_percent: 1.5 },
      { min_amount: 1000, max_amount: null, fee_percent: 1.0 },
    ],
  });
}
