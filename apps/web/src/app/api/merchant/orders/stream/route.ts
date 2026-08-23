import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const targetUrl = new URL('/api/merchant/orders/stream', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  const res = await fetch(targetUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    return new NextResponse('SSE connection failed', { status: res.status });
  }

  const reader = res.body?.getReader();
  if (!reader) {
    return new NextResponse('No stream available', { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Forward SSE chunks
          const chunk = new Uint8Array(value.length + 2);
          chunk[0] = 0x0a; // \n
          chunk.set(value, 1);
          controller.enqueue(chunk);
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
