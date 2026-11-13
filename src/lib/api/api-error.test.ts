import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios';
import { ApiError, toApiError } from './api-error';
import { errorMessage } from './error-messages';
import { checkImageFile, IMAGE_UPLOAD } from '@/config/upload';
import { canReorderSiblings } from '@/config/shared-data';
import { secondsUntilExpiry } from '@/lib/auth/session-storage';

function axiosFailure(status: number, message: string | string[] | null): AxiosError {
  const response = {
    status,
    data: message === null ? 'oops' : { success: false, message, data: null, errors: null, statusCode: status },
    headers: {},
    config: { headers: new AxiosHeaders() },
    statusText: '',
  } as AxiosResponse;
  return new AxiosError('fail', 'ERR', response.config, null, response);
}

describe('toApiError (real QA response shapes)', () => {
  it.each([
    [400, 'invalidPassword', 'business', '아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.'],
    [400, 'invalidCredentials', 'business', '등록되지 않은 계정입니다.'],
    [400, 'productNotFound', 'notFound', '상품을 찾을 수 없습니다.'],
    [401, 'Unauthorized', 'unauthorized', '로그인이 필요합니다.'],
    [403, 'forbidden', 'forbidden', '이 기능을 사용할 권한이 없습니다.'],
    [500, 'boom', 'server', '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'],
  ])('%s %s → %s', (status, key, kind, text) => {
    const error = toApiError(axiosFailure(status, key));
    expect(error.kind).toBe(kind);
    expect(errorMessage(error)).toBe(text);
  });

  it('shows the API validation sentences as written', () => {
    const error = toApiError(axiosFailure(400, ['name must be a string', 'name should not be empty']));
    expect(error.kind).toBe('validation');
    expect(errorMessage(error)).toBe('name must be a string\nname should not be empty');
  });

  it('no response at all is a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(error.kind).toBe('network');
    expect(errorMessage(error)).toContain('네트워크');
  });

  it('a non-JSON error body still gives a status-based message', () => {
    expect(toApiError(axiosFailure(502, null)).kind).toBe('server');
  });

  it('an unknown business key is shown with the key, never silently dropped', () => {
    expect(errorMessage(new ApiError('business', 400, ['somethingNew']))).toBe('요청을 처리하지 못했습니다. (somethingNew)');
  });
});

describe('upload, shared data and token checks', () => {
  it('image type and size', () => {
    expect(checkImageFile({ type: 'image/png', size: 1000 })).toBeNull();
    expect(checkImageFile({ type: 'image/gif', size: 1000 })).toBe('type');
    expect(checkImageFile({ type: 'image/jpeg', size: IMAGE_UPLOAD.maxBytes + 1 })).toBe('size');
    expect(checkImageFile({ type: 'image/jpeg', size: IMAGE_UPLOAD.maxBytes })).toBeNull();
  });

  it('reorder only when every sibling is our own HW3 record', () => {
    expect(canReorderSiblings(['HW3-Pranesh-A', 'HW3-Pranesh-B'])).toBe(true);
    expect(canReorderSiblings(['HW3-Pranesh-A', '주교재'])).toBe(false);
    expect(canReorderSiblings(['HW3-Pranesh-A'])).toBe(false);
  });

  it('reads the JWT expiry', () => {
    const payload = Buffer.from(JSON.stringify({ exp: 2_000 })).toString('base64url');
    expect(secondsUntilExpiry(`h.${payload}.s`, 1_000_000)).toBe(1_000);
    expect(secondsUntilExpiry('not-a-jwt')).toBe(0);
  });
});
