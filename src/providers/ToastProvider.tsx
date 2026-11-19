"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { Toast, type ToastMessage } from "primereact/toast";
import { ConfirmDialog } from "primereact/confirmdialog";

// One Toast and one ConfirmDialog for the whole app, so a message survives a route change
// (save → toast → list page) and screens never mount their own. Use with:
//   const toast = useToast();  toast.success('Product saved.');
//   const ok = await confirmAction({ … })   (src/utils/confirm.ts)

interface ToastContextValue {
  show: (message: ToastMessage) => void;
  success: (summary: string, detail?: string) => void;
  error: (summary: string, detail?: string) => void;
  info: (summary: string, detail?: string) => void;
  warn: (summary: string, detail?: string) => void;
}

const TOAST_LIFE_MS = 3500;

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warn: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null);

  const show = useCallback((message: ToastMessage) => {
    toast.current?.show({ life: TOAST_LIFE_MS, ...message });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (summary, detail) => show({ severity: "success", summary, detail }),
      error: (summary, detail) => show({ severity: "error", summary, detail }),
      info: (summary, detail) => show({ severity: "info", summary, detail }),
      warn: (summary, detail) => show({ severity: "warn", summary, detail }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      <Toast ref={toast} position="top-right" />
      <ConfirmDialog />
      {children}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
