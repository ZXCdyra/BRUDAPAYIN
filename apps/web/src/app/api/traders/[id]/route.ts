import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({
    id,
    login: 'trader', email: null,
    role: 'TRADER',
    active: true,
    created_at: '2024-01-15T10:00:00Z',
  });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, deleted: true });
}
