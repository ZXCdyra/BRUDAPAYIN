import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    total_invited: 5,
    active_invited: 3,
    total_commissions: 125.5,
    commissions_by_month: [
      { month: '2024-01', count: 1, amount: 25 },
      { month: '2024-02', count: 2, amount: 50 },
      { month: '2024-03', count: 2, amount: 50.5 },
    ],
  });
}
