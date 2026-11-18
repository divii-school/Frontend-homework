import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: '로그인 | 토킹클럽 관리자' };

/** /login — public. useSearchParams (returnTo) needs a Suspense boundary in the App Router. */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
