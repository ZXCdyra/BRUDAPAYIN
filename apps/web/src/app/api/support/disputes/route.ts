import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get('tab') || 'open';

  return NextResponse.json({
    items: tab === 'open'
      ? [
          { id: 'sd-001', order_id: 'ord-001', dispute_type: 'PAYMENT_MISMATCH', status: 'OPEN', created_at: new Date(Date.now() - 86400000).toISOString() },
        ]
      : [
          { id: 'sd-002', order_id: 'ord-002', dispute_type: 'AMOUNT_ERROR', status: 'RESOLVED', created_at: new Date(Date.now() - 172800000).toISOString() },
        ],
    total: 1,
  });
}
