"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { confirmAction } from "@/utils/confirm";

/** Design 8.1.1 #21: the same question for Cancel and for leaving through a link. */
export const LEAVE_CONFIRM_MESSAGE = "입력한 정보가 모두 삭제됩니다. 취소하시겠습니까?";

export function confirmLeave(): Promise<boolean> {
  return confirmAction({ header: "취소", message: LEAVE_CONFIRM_MESSAGE, acceptLabel: "예", rejectLabel: "아니오", danger: true });
}

/**
 * While `enabled` (the form has unsaved changes):
 *  - closing / reloading the tab shows the browser's "Leave site?" dialog (beforeunload)
 *  - clicking an in-app link (sidebar, breadcrumb) asks first; Yes → `onLeave()` then navigate
 * The App Router has no "route change blocked" event, so links are caught in the capture phase.
 */
export function useLeaveGuard(enabled: boolean, onLeave: () => void): void {
  const router = useRouter();
  const onLeaveRef = useRef(onLeave);
  onLeaveRef.current = onLeave;

  useEffect(() => {
    if (!enabled) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      void confirmLeave().then((ok) => {
        if (!ok) return;
        onLeaveRef.current();
        router.push(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled, router]);
}
