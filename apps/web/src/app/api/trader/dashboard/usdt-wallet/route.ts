import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  return NextResponse.json({
    usdt_balance: 500.0,
    overdraft: 0,
    monitored_deposit_addresses: [
      { address: 'TTray...', network: 'TRC-20', is_default: true },
      { address: 'TBxyz...', network: 'TRC-20', is_default: false },
    ],
  });
}
