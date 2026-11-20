import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import 'primereact/resources/themes/lara-light-pink/theme.css';
import 'primeicons/primeicons.css';
import '@/styles/globals.scss';
import { AppProviders } from '@/components/providers/AppProviders';

export const metadata: Metadata = {
  title: '토킹클럽 관리자',
  description: '토킹클럽 쇼핑몰 관리',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" data-theme="light" suppressHydrationWarning>
      <body>
        <a href="#main" className="sr-only">
          본문 바로가기
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
