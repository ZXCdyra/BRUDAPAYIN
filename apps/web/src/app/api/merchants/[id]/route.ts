import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, login: 'merchant', email: null, active: true });
}

export async function POST(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, locked: true });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, locked: false });
}
