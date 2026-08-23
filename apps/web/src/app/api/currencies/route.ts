import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', name: 'RUB Bank Transfer', code: 'RUB_BANK', active: true },
    ],
    total: 1,
  });
}
