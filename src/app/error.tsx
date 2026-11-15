"use client";

import { Button } from "primereact/button";
import { StateBlock } from "@/components/common/StateBlock";

/** Last line of defence: a page that threw while rendering shows this instead of a blank screen. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="login-page">
      <StateBlock
        kind="error"
        title="화면을 표시하는 중 오류가 발생했습니다."
        description="잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
        action={<Button type="button" label="다시 시도" icon="pi pi-refresh" onClick={reset} />}
      />
    </main>
  );
}
