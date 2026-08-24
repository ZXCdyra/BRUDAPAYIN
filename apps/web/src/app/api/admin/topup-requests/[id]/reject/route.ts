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

    // Simulate rejecting a top-up request
    const updatedRequest = {
      id,
      status: 'REJECTED',
      adminNote: 'Отклонено через API',
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to reject top-up request' },
      { status: 500 }
    );
  }
}
