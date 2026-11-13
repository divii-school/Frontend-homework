"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { Toast } from "primereact/toast";

type ToastKind = "success" | "error";

interface ToastContextValue {
  notify: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** One PrimeReact Toast for the whole app (role="alert" is set by PrimeReact on each message). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null);

  const notify = useCallback((kind: ToastKind, message: string) => {
    toast.current?.show({ severity: kind, detail: message, life: kind === "error" ? 5000 : 3000 });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast ref={toast} position="top-right" />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
