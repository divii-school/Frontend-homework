import { Suspense, type ReactNode } from "react";
import { StateBlock } from "@/components/common/StateBlock";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Every page in the (main) group gets the shell (menu, top bar, route guard). "(main)" adds nothing to the URL.
 * Suspense: the pages read the query string (useSearchParams), which Next.js only allows inside a Suspense boundary.
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StateBlock kind="loading" title="불러오는 중입니다." />}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
