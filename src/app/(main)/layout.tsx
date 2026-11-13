import { Suspense, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { RouteGuard } from '@/components/layout/route-guard';

/** Every admin page: side menu + header, behind the route guard. (main) does not appear in the URL. */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <Suspense>
        <RouteGuard>{children}</RouteGuard>
      </Suspense>
    </AppShell>
  );
}
