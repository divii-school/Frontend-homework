'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Toast } from 'primereact/toast';

type ToastKind = 'success' | 'error' | 'info' | 'warn';

interface ToastContextValue {
  show: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** One toast area for the whole app; screens call useToast().show(...). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Toast>(null);
  const show = useCallback((kind: ToastKind, message: string) => {
    ref.current?.show({ severity: kind, detail: message, life: kind === 'error' ? 5000 : 3000 });
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      <Toast ref={ref} position="top-center" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
