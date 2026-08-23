import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  return NextResponse.json({
    order_id: orderId,
    history: [
      { status: 'PENDING', timestamp: new Date(Date.now() - 600000).toISOString(), note: 'Order created' },
      { status: 'PROCESSING', timestamp: new Date(Date.now() - 300000).toISOString(), note: 'Under review' },
      { status: 'COMPLETED', timestamp: new Date(Date.now() - 60000).toISOString(), note: 'Completed' },
    ],
  });
}
