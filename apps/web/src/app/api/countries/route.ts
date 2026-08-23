import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    items: [{ id: '1', name: 'Россия', code: 'RU', active: true }],
    total: 1,
  });
}
