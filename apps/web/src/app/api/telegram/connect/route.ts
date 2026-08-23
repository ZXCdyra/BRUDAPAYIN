import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'UPDATED',
    settings: {
      telegram_enabled: true,
      bot_username: 'my_bot',
      chat_id: '123456789',
    },
  });
}
