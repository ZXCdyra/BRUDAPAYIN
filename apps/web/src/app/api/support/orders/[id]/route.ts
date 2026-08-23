import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({
    id,
    status: 'OPEN',
    order_id: 'ord-001',
    reason: 'Payment not received',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  });
}
