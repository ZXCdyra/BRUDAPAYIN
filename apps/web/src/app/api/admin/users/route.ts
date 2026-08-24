import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const role = searchParams.get('role') || undefined;

  return NextResponse.json({
    items: [
      { id: 'usr-001', login: 'admin', email: null, role: 'ADMIN', active: true, created_at: '2024-01-01T00:00:00Z' },
      { id: 'usr-002', login: 'trader1', email: null, role: 'TRADER', active: true, created_at: '2024-01-15T10:00:00Z' },
      { id: 'usr-003', login: 'merchant1', email: null, role: 'MERCHANT', active: true, created_at: '2024-02-01T12:00:00Z' },
    ],
    total: 3,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login, password, role, email } = body;

    if (!login || !password || !role) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'login, password, and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['TRADER', 'MERCHANT', 'ADMIN', 'SUPPORT', 'PAYOUT_TRADER', 'OWNER', 'REFERRAL'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { code: 'INVALID_ROLE', message: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }

    // Simulate user creation
    const newUser = {
      id: `usr-${Date.now()}`,
      login,
      email: email || null,
      role,
      active: true,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { code: 'ERROR', message: 'Failed to create user' },
      { status: 500 }
    );
  }
}
