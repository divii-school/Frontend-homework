'use client';

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { Toast } from 'primereact/toast';

type Severity = 'success' | 'info' | 'warn' | 'error';
interface ToastApi {
  show: (severity: Severity, detail: string, summary?: string) => void;
}

const SUMMARY: Record<Severity, string> = { success: '완료', info: '안내', warn: '확인 필요', error: '오류' };
const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const ref = useRef<Toast>(null);
  const show = useCallback((severity: Severity, detail: string, summary?: string) => {
    ref.current?.show({ severity, summary: summary ?? SUMMARY[severity], detail, life: 3000 });
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      <Toast ref={ref} position="top-right" />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
