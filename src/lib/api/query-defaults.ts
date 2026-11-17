import { ApiError } from './api-error';

/** Do not retry errors a retry cannot fix (auth, permission, not found, validation, our own bugs). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (
    error instanceof ApiError &&
    ['unauthorized', 'forbidden', 'notFound', 'validation', 'business', 'unknown'].includes(error.kind)
  ) {
    return false;
  }
  return failureCount < 2;
}

/**
 * Whether the default error toast should show for a failed query or mutation.
 * Not when the screen shows the error itself (`meta.handlesError`), and not for 401:
 * the http client is already sending the user to login.
 */
export function needsDefaultToast(error: unknown, meta: { handlesError?: boolean } | undefined): boolean {
  if (meta?.handlesError) return false;
  return !(error instanceof ApiError && error.kind === 'unauthorized');
}
