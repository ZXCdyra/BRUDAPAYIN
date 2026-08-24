import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params?.orderId;
    const body = await request.json();
    const { actualAmount } = body;

    // Simulate confirming an order as successfully completed
    const updatedOrder = {
      id: orderId,
      status: 'PAID',
      actual_amount: actualAmount,
      confirmed_at: new Date().toISOString(),
      message: 'Order confirmed successfully',
    };

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to confirm order' },
      { status: 500 }
    );
  }
}
