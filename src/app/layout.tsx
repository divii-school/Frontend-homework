import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "primeicons/primeicons.css";
import "@/styles/style.scss";
import { AppProviders } from "@/components/providers/AppProviders";
import { THEME_STORAGE_KEY } from "@/constants/auth";

export const metadata: Metadata = {
  title: { default: "Talking Club 관리자", template: "%s · Talking Club 관리자" },
  description: "Talking Club 관리자 - 쇼핑몰 관리",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Runs before the first paint: put the remembered theme (or the system preference) on <html>, so a dark-mode
// user never sees a white flash. It is a constant string; nothing from the user is put into it.
// Pretendard, the font of the Figma frames, as a web font (design review: the font must not depend on the PC).
// The dynamic-subset stylesheet makes the browser download only the Korean glyph groups a page uses. Pinned version.
const PRETENDARD_CSS = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard-dynamic-subset.min.css";

const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(!t){t=matchMedia("(prefers-color-scheme: dark)").matches?"night":"day"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning: the script above sets data-theme before React compares the markup
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
