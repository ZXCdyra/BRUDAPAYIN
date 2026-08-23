import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', name: 'Bank Transfer', code: 'BANK_TRANSFER', active: true },
      { id: '2', name: 'Card', code: 'CARD', active: true },
      { id: '3', name: 'Crypto', code: 'CRYPTO', active: true },
    ],
    total: 3,
  });
}
