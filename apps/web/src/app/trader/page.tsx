'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TraderRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/ru/trader'); }, [router]);
  return null;
}
