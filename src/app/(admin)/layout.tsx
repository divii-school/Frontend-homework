import type { ReactNode } from 'react';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { AdminShell } from '@/components/layout/AdminShell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AdminShell>{children}</AdminShell>
    </AuthGuard>
  );
}
