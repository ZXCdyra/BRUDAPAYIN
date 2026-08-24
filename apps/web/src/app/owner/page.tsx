'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OwnerRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/ru/owner'); }, [router]);
  return null;
}
