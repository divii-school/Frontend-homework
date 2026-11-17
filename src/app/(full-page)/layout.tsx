import type { ReactNode } from "react";
import { ThemeToggle } from "@/components";

// Screens without the admin chrome (login, 403): centred card on the page background,
// theme toggle in the corner so light / dark also works before logging in.
export default function FullPageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="full-page">
      <div className="full-page-theme">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
