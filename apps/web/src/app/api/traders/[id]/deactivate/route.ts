import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ id, active: false });
}
