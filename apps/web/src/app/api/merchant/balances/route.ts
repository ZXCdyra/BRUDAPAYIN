import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    balances: [
      { currency: 'USD', available: 5430.75, pending: 200.0 },
      { currency: 'EUR', available: 1200.0, pending: 0 },
    ],
  });
}
