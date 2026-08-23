import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', name: 'Sberbank', code: 'SBERBANK', type: 'BANK_TRANSFER', active: true, currencies: ['RUB'] },
      { id: '2', name: 'Tinkoff', code: 'TINKOFF', type: 'BANK_TRANSFER', active: true, currencies: ['RUB'] },
      { id: '3', name: 'Alfa Bank', code: 'ALFA_BANK', type: 'BANK_TRANSFER', active: true, currencies: ['RUB'] },
    ],
    total: 3,
  });
}
