import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { AdminShell } from "@/components/layout/AdminShell";

// Every page in the (admin) group needs a login and shares the sidebar + header.
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <RequireAuth>
        <AdminShell>{children}</AdminShell>
      </RequireAuth>
    </Suspense>
  );
}
