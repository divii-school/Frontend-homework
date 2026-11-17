import { Suspense } from "react";
import type { Metadata } from "next";
import ForbiddenView from "@/components/auth/ForbiddenView";
import { PageLoader } from "@/components";

export const metadata: Metadata = { title: "No permission" };

// 403: the role / permissions can't open the requested URL (middleware or RouteGuard sent us here).
export default function ForbiddenPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ForbiddenView />
    </Suspense>
  );
}
