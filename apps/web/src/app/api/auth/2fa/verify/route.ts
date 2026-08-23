import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { code, tempToken } = (await request.json()) as { code?: string; tempToken?: string };

  if (!code || code.length !== 6 || !/\d{6}/.test(code)) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Invalid 2FA code' },
      { status: 400 },
    );
  }

  // In production, verify against TOTP secret
  // For demo: accept any 6-digit code
  const login = 'trader';
  const userId = 'usr-demo';
  const role = 'TRADER';
  const now = Math.floor(Date.now() / 1000);

  const accessToken = createJwt({
    sub: userId,
    id: userId,
    login,
    role,
    exp: now + 3600,
    iat: now,
  });

  const refreshToken = createJwt({
    sub: userId,
    role,
    exp: now + 604800,
    iat: now,
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    user: { id: userId, login, email: null, role, name: 'Demo User' },
  });
}

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from(`sig-${header}.${body}`).toString('base64url');
  return `${header}.${body}.${signature}`;
}
