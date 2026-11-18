import type { Metadata } from 'next';
import 'primeicons/primeicons.css';
import '@/styles/globals.scss';
import { AppProviders } from '@/providers/app-providers';
import { PrimeThemeLinks } from '@/components/common/prime-theme-links';

export const metadata: Metadata = {
  title: '토킹클럽 관리자 | 쇼핑몰 관리',
  description: 'Talking Club admin — shopping mall management (HW3)',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <PrimeThemeLinks />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
