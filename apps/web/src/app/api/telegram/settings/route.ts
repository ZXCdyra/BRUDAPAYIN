import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    is_connected: false,
    bot_username: '',
    chat_id: null,
  });
}

export async function POST(request: NextRequest) {
  const { bot_token } = await request.json();
  return NextResponse.json({
    is_connected: true,
    bot_username: 'my_bot',
    chat_id: '123456789',
  });
}
