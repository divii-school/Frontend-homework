'use client';

import { useEffect } from 'react';
import { StateBlock } from '@/components/common/state-block';

/** Catches an unexpected crash inside an admin page; the side menu and header stay usable. */
export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Shown in the browser console for the bug report; no user data is in it.
    console.error('Page crashed', error.digest ?? error.message);
  }, [error]);

  return (
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
  );
}
