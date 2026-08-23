export async function POST(request: Request) {
  const { login, password } = (await request.json()) as { login: string; password: string };

  if (!login) {
    return new Response(
      JSON.stringify({ code: 'VALIDATION_ERROR', message: 'Login is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Accept any login + any password (including empty) for demo
  const role = login.includes('admin') ? 'ADMIN'
    : login.includes('merchant') ? 'MERCHANT'
    : login.includes('owner') ? 'OWNER'
    : login.includes('payout') ? 'PAYOUT_TRADER'
    : 'TRADER';

  const userId = login || 'user';
  const now = Date.now();
  const accessToken = createJwt({
    sub: `usr-${userId}`,
    id: `usr-${userId}`,
    login,
    role,
    exp: Math.floor(now / 1000) + 3600,
    iat: Math.floor(now / 1000),
  });

  const refreshToken = createJwt({
    sub: `usr-${userId}`,
    role,
    exp: Math.floor(now / 1000) + 604800,
    iat: Math.floor(now / 1000),
  });

  return new Response(
    JSON.stringify({
      accessToken,
      refreshToken,
      user: {
        id: `usr-${userId}`,
        login,
        email: null,
        role,
        name: login,
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

function createJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = Buffer.from(`sig-${header}.${body}`).toString('base64url');
  return `${header}.${body}.${signature}`;
}
