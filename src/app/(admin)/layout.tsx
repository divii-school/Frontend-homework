import { Suspense } from "react";
import { RequireAuth } from "@/features/auth/RequireAuth";

// Every page in the (admin) group needs a login. The admin shell (sidebar, header) comes next.
export default function AdminLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense>
      <RequireAuth>{children}</RequireAuth>
    </Suspense>
  );
}
