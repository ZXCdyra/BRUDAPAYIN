import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  // Simulate fetching top-up requests
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tx_hash, network, amount_usdt, comment } = body;

    if (!tx_hash || !amount_usdt) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'tx_hash and amount_usdt are required' },
        { status: 400 }
      );
    }

    // Simulate creating a top-up request
    const newRequest = {
      id: `topup-${Date.now()}`,
      txHash: tx_hash,
      network,
      amountUsdt: String(amount_usdt),
      status: 'PENDING',
      comment: comment || null,
      adminNote: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvedAt: null,
      rejectedAt: null,
    };

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to create top-up request' },
      { status: 500 }
    );
  }
}
