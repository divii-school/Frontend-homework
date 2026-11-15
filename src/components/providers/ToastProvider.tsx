"use client";

import { Toast, type ToastMessage } from "primereact/toast";
import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { TOAST_LIFE_MS } from "@/constants/products";

type ShowToast = (message: Pick<ToastMessage, "severity" | "summary" | "detail">) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** One toast region for the whole app, so a form can save, go back to the list and still confirm the save there. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useRef<Toast>(null);
  const show = useCallback<ShowToast>((message) => {
    toast.current?.show({ life: TOAST_LIFE_MS, ...message });
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <Toast ref={toast} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
