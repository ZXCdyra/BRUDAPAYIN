import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    settings: {
      auto_assign_enabled: true,
      min_rating: 4.0,
      max_processing_time_sec: 300,
      priority_methods: ['CARD_P2P', 'SBP_P2P'],
    },
  });
}
