'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect /dashboard → /tasks
export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/tasks');
  }, [router]);
  return null;
}
