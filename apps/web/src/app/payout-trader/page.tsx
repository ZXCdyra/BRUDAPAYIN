'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayoutTraderRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/ru/payout-trader'); }, [router]);
  return null;
}
