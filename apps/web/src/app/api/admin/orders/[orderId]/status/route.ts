import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params?.id;
    if (!orderId) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Order ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, comment } = body;

    const validStatuses = ['COMPLETED', 'EXPIRED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { code: 'INVALID_STATUS', message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      COMPLETED: 'PAID',
      EXPIRED: 'CANCELED',
      CANCELED: 'CANCELED',
    };

    // Simulate order status update
    const updatedOrder = {
      id: orderId,
      status: statusMap[status] || status,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
