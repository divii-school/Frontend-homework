'use client';

import { useEffect } from 'react';
import { StateBlock } from '@/components/common/state-block';
import styles from './not-found.module.scss';

/**
 * Crash screen for pages outside the admin shell (the login page). Admin pages have their own,
 * (main)/error.tsx, which keeps the side menu; a crash in the root layout itself is global-error.tsx.
 */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Shown in the browser console for the bug report; no user data is in it.
    console.error('Page crashed', error.digest ?? error.message);
  }, [error]);

  return (
    <main className={styles['not-found-page']}>
      <StateBlock
        variant="error"
        title="화면을 표시하는 중 오류가 발생했습니다."
        description="잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
        action={
          <button type="button" className="p-button p-component" onClick={reset}>
            다시 시도
          </button>
        }
      />
    </main>
  );
}
