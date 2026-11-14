import type { Metadata } from 'next';
import 'primeicons/primeicons.css';
import '@/styles/globals.scss';
import { AppProviders } from '@/providers/app-providers';
import { THEME_BOOT_SCRIPT } from '@/providers/theme-provider';

export const metadata: Metadata = {
  title: '토킹클럽 관리자 | 쇼핑몰 관리',
  description: 'Talking Club admin — shopping mall management (HW3)',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        {/* Before the first paint: picks light/dark and adds the PrimeReact theme stylesheet,
            so there is no light flash in dark mode and React never sees the <link> (no hydration mismatch). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
