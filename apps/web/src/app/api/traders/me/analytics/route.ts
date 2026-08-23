import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    profit: 1250.5,
    volumes: [
      { period: '2024-01', volume: 45000, profit: 450 },
      { period: '2024-02', volume: 52000, profit: 520 },
      { period: '2024-03', volume: 48000, profit: 480 },
    ],
    top_traders: [
      { trader_id: 'usr-001', volume: 15000, orders: 45 },
      { trader_id: 'usr-002', volume: 12000, orders: 38 },
    ],
  });
}
