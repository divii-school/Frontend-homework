import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "primeicons/primeicons.css";
import "primeflex/primeflex.css";
// Pretendard = the font of the Korean Figma frames (text nodes: "Pretendard" Regular / Medium / SemiBold / Bold).
// Self-hosted as the "dynamic subset" of the npm package pretendard 1.3.9 (SIL OFL 1.1; the package itself is
// not a dependency): 92 small files in public/fonts/pretendard/ and one @font-face rule per file with its
// unicode-range (src/styles/pretendard-font.css). The browser downloads only the files for the characters a
// page shows (a few hundred KB) instead of the whole 2 MB font, and no request leaves the app.
// $font-family-base in _tokens.scss puts 'Pretendard Variable' first.
import "@/styles/pretendard-font.css";
import "@/styles/globals.scss";
import AppProviders from "@/providers/AppProviders";
import { PRIME_THEME_HREF, THEME_INIT_SCRIPT, THEME_LINK_IDS } from "@/utils/theme";

export const metadata: Metadata = {
  title: { default: "토킹클럽 관리자", template: "%s | 토킹클럽 관리자" },
  description: "토킹클럽 관리자 — 쇼핑몰 관리: 상품 관리 및 상품 카테고리 관리 (HW3).",
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
    <html lang="ko" data-theme="light" suppressHydrationWarning>
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
