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

  if (user.exp && user.exp * 1000 < Date.now()) {
    return NextResponse.json({ code: 'TOKEN_EXPIRED', message: 'Token has expired' }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: (user.sub as string) || (user.id as string) || 'unknown',
      login: ((user.login as string) || (user.email as string)) ?? '',
      email: (user.email as string) ?? null,
      role: (user.role as string) || 'TRADER',
      name:
        (user.name as string) ||
        ((user.login as string) || (user.email as string) || '').split('@')[0],
    },
  });
}

interface JwtPayload {
  sub?: string;
  id?: string;
  login?: string;
  email?: string;
  role?: string;
  name?: string;
  exp?: number;
  iat?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}
