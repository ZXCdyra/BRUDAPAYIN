import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { refreshToken } = (await request.json()) as { refreshToken?: string };

  if (!refreshToken) {
    return NextResponse.json(
      { code: 'VALIDATION_ERROR', message: 'Refresh token is required' },
      { status: 400 },
    );
  }

  const decoded = decodeJwtPayload(refreshToken);
  if (!decoded || !decoded.sub) {
    return NextResponse.json(
      { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
      { status: 401 },
    );
  }

  if (decoded.exp && decoded.exp * 1000 < Date.now()) {
    return NextResponse.json(
      { code: 'TOKEN_EXPIRED', message: 'Refresh token expired' },
      { status: 401 },
    );
  }

  const login = decoded.sub;
  const role = (decoded.role as string) || 'TRADER';
  const userId = decoded.sub.startsWith('usr-') ? decoded.sub : `usr-${decoded.sub}`;
  const now = Math.floor(Date.now() / 1000);

  const newAccessToken = createJwt({
    sub: userId,
    id: userId,
    login,
    role,
    exp: now + 3600,
    iat: now,
  });

  const newRefreshToken = createJwt({
    sub: decoded.sub,
    role,
    exp: now + 604800,
    iat: now,
  });

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
}

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from(`sig-${header}.${body}`).toString('base64url');
  return `${header}.${body}.${signature}`;
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
