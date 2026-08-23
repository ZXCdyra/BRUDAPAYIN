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
