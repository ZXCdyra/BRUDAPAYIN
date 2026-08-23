import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: 'dir-001', name: 'RUB → RUB', from: 'RUB', to: 'RUB', active: true },
    ],
    total: 1,
  });
}
