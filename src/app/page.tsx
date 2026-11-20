'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressSpinner } from 'primereact/progressspinner';
import { homeFor } from '@/config/access';
import { useAuth } from '@/features/auth/AuthProvider';

export default function Home() {
  const { status, profile } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === 'anonymous') router.replace('/login');
    if (status === 'authenticated') router.replace(homeFor(profile?.role));
  }, [status, profile, router]);
  return (
    <div className="page-center" role="status">
      <ProgressSpinner style={{ width: 40, height: 40 }} />
      <span className="sr-only">불러오는 중입니다.</span>
    </div>
  );
}
