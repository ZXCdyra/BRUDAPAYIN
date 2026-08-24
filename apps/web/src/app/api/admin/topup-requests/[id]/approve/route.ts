import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Simulate approving a top-up request
    const updatedRequest = {
      id,
      status: 'APPROVED',
      adminNote: 'Одобрено через API',
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to approve top-up request' },
      { status: 500 }
    );
  }
}
