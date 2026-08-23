import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const backendUrl = new URL('/api/merchant/orders', apiUrl);
    const params = new URLSearchParams();
    if (direction) params.set('direction', direction);
    params.set('page', String(page));
    params.set('limit', String(limit));
    if (status) params.set('status', status);
    if (search) params.set('search', search);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    backendUrl.search = params.toString();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const res = await fetch(backendUrl.toString(), {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { data: [], total: 0, page, limit: Math.min(limit, 50), totalPages: 0 },
        { status: res.status },
      );
    }

    const raw = await res.json();
    // Ensure response has correct structure
    const data = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return NextResponse.json({
      data,
      total: raw?.total ?? data.length,
      page,
      limit: Math.min(limit, 50),
      totalPages: Math.max(1, Math.ceil((raw?.total ?? data.length) / limit)),
    });
  } catch {
    return NextResponse.json(
      { data: [], total: 0, page, limit: Math.min(limit, 50), totalPages: 0 },
      { status: 502 },
    );
  }
}
