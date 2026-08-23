import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', name: 'RUB → RUB', currency_from: 'RUB', currency_to: 'RUB', active: true },
    ],
    total: 1,
  });
}
