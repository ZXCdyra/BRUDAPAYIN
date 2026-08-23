import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    items: [
      { id: 'req-001', rating: 4.8, method: 'Sberbank', currency: 'RUB', active_orders: 5 },
      { id: 'req-002', rating: 4.5, method: 'Tinkoff', currency: 'RUB', active_orders: 3 },
      { id: 'req-003', rating: 4.9, method: 'VTB', currency: 'RUB', active_orders: 7 },
    ],
  });
}
