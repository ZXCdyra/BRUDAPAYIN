import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    referral_code: 'REF-USER-12345',
    referral_link: 'https://platform.example.com/register?ref=REF-USER-12345',
    invited_count: 5,
    commissions_earned: 125.5,
    currency: 'USD',
  });
}
