import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  // Simulate fetching all top-up requests (admin view)
  const requests = [
    {
      id: 'topup-001',
      txHash: '0x1234567890abcdef1234567890abcdef12345678',
      network: 'TRC20',
      amountUsdt: '100.00',
      status: 'PENDING' as const,
      comment: 'Первое пополнение',
      adminNote: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      approvedAt: null,
      rejectedAt: null,
      userId: 'usr-001',
    },
    {
      id: 'topup-002',
      txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
      network: 'TRC20',
      amountUsdt: '250.00',
      status: 'APPROVED' as const,
      comment: 'Пополнение баланса',
      adminNote: 'Одобрено администратором',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 80000000).toISOString(),
      approvedAt: new Date(Date.now() - 80000000).toISOString(),
      rejectedAt: null,
      userId: 'usr-001',
    },
    {
      id: 'topup-003',
      txHash: '0xfedcba0987654321fedcba0987654321fedcba09',
      network: 'TRC20',
      amountUsdt: '50.00',
      status: 'REJECTED' as const,
      comment: 'Пополнение',
      adminNote: 'Неверный хеш транзакции',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 160000000).toISOString(),
      approvedAt: null,
      rejectedAt: new Date(Date.now() - 160000000).toISOString(),
      userId: 'usr-002',
    },
  ];

  const total = requests.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginated = requests.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    data: paginated,
    total,
    page,
    limit,
  });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Request ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, adminNote } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { code: 'INVALID_ACTION', message: 'Action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Simulate updating top-up request
    const updatedRequest = {
      id,
      status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      adminNote: adminNote || null,
      ...(action === 'approve'
        ? { approvedAt: new Date().toISOString() }
        : { rejectedAt: new Date().toISOString() }),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedRequest, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to update top-up request' },
      { status: 500 }
    );
  }
}

// POST /api/admin/topup-requests/{id}/approve
export async function POST_APPROVE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Request ID is required' },
        { status: 400 }
      );
    }

    const updatedRequest = {
      id,
      status: 'APPROVED',
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

// POST /api/admin/topup-requests/{id}/reject
export async function POST_REJECT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Request ID is required' },
        { status: 400 }
      );
    }

    const updatedRequest = {
      id,
      status: 'REJECTED',
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
