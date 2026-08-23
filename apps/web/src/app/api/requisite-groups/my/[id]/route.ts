import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({
    id,
    name: 'Requisite Group Details',
    is_root: true,
    child_count: 2,
    created_at: '2024-01-15T10:00:00Z',
  });
}

export async function POST(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, restored: true });
}
