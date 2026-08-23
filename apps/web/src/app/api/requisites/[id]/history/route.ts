import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.pathname.split("/").filter(Boolean).pop() || "";
  return NextResponse.json({
    requisite_id: id,
    history: [
      { action: 'CREATED', timestamp: new Date(Date.now() - 86400000 * 7).toISOString(), details: 'Initial creation' },
      { action: 'ACTIVATED', timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), details: 'Activated by user' },
      { action: 'DEACTIVATED', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), details: 'Temporarily deactivated' },
      { action: 'ACTIVATED', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Re-activated' },
    ],
  });
}
