import { describe, expect, it } from 'vitest';
import { ApiError } from './api-error';
import { needsDefaultToast, shouldRetry } from './query-defaults';

describe('default error toast (QueryCache / MutationCache)', () => {
  it('shows for a failure no screen handles', () => {
    expect(needsDefaultToast(new ApiError('server', 500, []), undefined)).toBe(true);
    expect(needsDefaultToast(new ApiError('business', 400, ['x']), {})).toBe(true);
    expect(needsDefaultToast(new TypeError('bug'), undefined)).toBe(true);
  });

  it('stays quiet when the screen shows the error itself', () => {
    expect(needsDefaultToast(new ApiError('server', 500, []), { handlesError: true })).toBe(false);
  });

  it('stays quiet on 401: the user is already on the way to login', () => {
    expect(needsDefaultToast(new ApiError('unauthorized', 401, []), undefined)).toBe(false);
  });
});

describe('retry', () => {
  it('retries what a retry can fix, at most twice', () => {
    expect(shouldRetry(0, new ApiError('network', null, []))).toBe(true);
    expect(shouldRetry(1, new ApiError('server', 500, []))).toBe(true);
    expect(shouldRetry(2, new ApiError('server', 500, []))).toBe(false);
  });

  it.each(['unauthorized', 'forbidden', 'notFound', 'validation', 'business', 'unknown'] as const)(
    'never retries %s',
    (kind) => {
      expect(shouldRetry(0, new ApiError(kind, null, []))).toBe(false);
    },
  );
});
