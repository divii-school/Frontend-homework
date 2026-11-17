import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
import "@/styles/globals.scss";
import AppProviders from "@/providers/AppProviders";
import { PRIME_THEME_HREF, THEME_INIT_SCRIPT, THEME_LINK_IDS } from "@/utils/theme";

export const metadata: Metadata = {
  title: { default: "TalkingClub Admin", template: "%s | TalkingClub Admin" },
  description: "Talking Club admin — Shopping Mall: product and product category management (HW3).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Root layout: both PrimeReact theme stylesheets + the theme init script (before first paint), client providers.
// The script sets data-theme and media="not all" on the inactive stylesheet before React hydrates,
// hence suppressHydrationWarning on <html> and the two links (see src/utils/theme.ts).
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link id={THEME_LINK_IDS.light} rel="stylesheet" href={PRIME_THEME_HREF.light} suppressHydrationWarning />
        <link id={THEME_LINK_IDS.dark} rel="stylesheet" href={PRIME_THEME_HREF.dark} suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
