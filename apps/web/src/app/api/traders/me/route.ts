import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const user = decodeJwtPayload(token);

  if (!user || !(user.login || user.email)) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Invalid token' }, { status: 401 });
  }

  const mockProfile = {
    id: (user.sub as string) || (user.id as string) || 'usr-demo',
    login: (user.login as string) ?? (user.email as string),
    role: (user.role as string) || 'TRADER',
    name: (user.name as string) || ((user.login as string) ?? (user.email as string)),
    balance: 1250.75,
    currency: 'USD',
    accepting_orders: true,
    account_active: true,
    created_at: '2024-01-15T10:00:00Z',
    cascade_processing_method: 'AUTO',
    cascade_rating_multiplier: 1.0,
  };

  return NextResponse.json(mockProfile);
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}
