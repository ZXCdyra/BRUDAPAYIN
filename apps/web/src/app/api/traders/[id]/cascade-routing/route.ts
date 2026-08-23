import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({ cascade_processing_method: 'AUTO', cascade_rating_multiplier: 1.0 });
}
