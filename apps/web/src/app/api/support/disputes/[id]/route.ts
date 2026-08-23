import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({
    id,
    order_id: 'ord-001',
    status: 'OPEN',
    dispute_type: 'PAYMENT_MISMATCH',
    notes: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  const { note } = await request.json();
  return NextResponse.json({
    id,
    note_added: true,
    text: note,
    timestamp: new Date().toISOString(),
  });
}
