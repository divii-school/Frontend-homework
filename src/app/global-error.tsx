'use client';

import { useEffect } from 'react';
import 'primeicons/primeicons.css';
import '@/styles/globals.scss';
import { StateBlock } from '@/components/common/state-block';
import { ROUTES } from '@/config/app-routes';
import { PrimeThemeLinks } from '@/components/common/prime-theme-links';
import styles from './not-found.module.scss';

/**
 * Last-resort crash screen: used when the root layout itself (or its providers) throws, so it
 * replaces <html> and must bring its own styles and theme. Uses no provider and no hook from
 * the app, because those are what may have failed.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('App crashed', error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <title>오류 | 토킹클럽 관리자</title>
        <PrimeThemeLinks />
      </head>
      <body>
        <main className={styles['not-found-page']}>
          <StateBlock
            variant="error"
            title="화면을 표시하는 중 오류가 발생했습니다."
            description="잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
            action={
              <>
                <button type="button" className="p-button p-component" onClick={reset}>
                  다시 시도
                </button>{' '}
                {/* A plain link (full page load): the app's router may be what broke. */}
                <a href={ROUTES.home} className="p-button p-button-outlined p-component">
                  상품 관리로 이동
                </a>
              </>
            }
          />
        </main>
      </body>
    </html>
  );
}
