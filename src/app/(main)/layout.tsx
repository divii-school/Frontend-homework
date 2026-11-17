import type { ReactNode } from "react";
import { AppShell } from "@/components";
import AuthGate from "@/providers/AuthGate";
import RouteGuard from "@/providers/RouteGuard";

// Every screen under (main) is admin-only: session check → role / permission check → admin chrome.
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <RouteGuard>
        <AppShell>{children}</AppShell>
      </RouteGuard>
    </AuthGate>
  );
}
