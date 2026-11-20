'use client';

import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { ApiError, statusMessage } from '@/lib/api/client';

/** Loading / error / empty block used by every list, tab and form. */
export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyText = '데이터가 없습니다.',
  onRetry,
}: {
  isLoading?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="state-box" role="status" aria-live="polite">
        <ProgressSpinner style={{ width: 32, height: 32 }} strokeWidth="4" />
        <div>불러오는 중입니다.</div>
      </div>
    );
  }
  if (error) {
    const msg = error instanceof ApiError ? error.message || statusMessage(error.status) : statusMessage(500);
    return (
      <div className="state-box" role="alert">
        <p>{msg}</p>
        {onRetry && <Button label="다시 시도" outlined onClick={onRetry} />}
      </div>
    );
  }
  if (isEmpty) return <div className="state-box">{emptyText}</div>;
  return null;
}

export function errorText(err: unknown): string {
  if (err instanceof ApiError) return err.message || statusMessage(err.status);
  if (err instanceof Error) return err.message;
  return statusMessage(500);
}
