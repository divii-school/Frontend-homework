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

  it('turns the API validation sentences into Korean, one line each', () => {
    const error = toApiError(axiosFailure(400, ['name must be a string', 'name should not be empty']));
    expect(error.kind).toBe('validation');
    expect(errorMessage(error)).toBe('카테고리명: 문자로 입력해 주세요.\n카테고리명: 필수 입력 항목입니다.');
  });

  it.each([
    ['productName must be shorter than or equal to 100 characters', '상품명: 100자 이하로 입력해 주세요.'],
    ['price must not be less than 1', '판매가: 1 이상으로 입력해 주세요.'],
    ['each value in ids must be a number conforming to the specified constraints', '선택한 항목: 숫자로 입력해 주세요.'],
    ['images.0 must be a string', '상품 이미지: 문자로 입력해 주세요.'],
    ['taxType must be one of the following values: tax, tax_free', '과세 구분: 선택할 수 없는 값입니다.'],
    ['someNewField should not be empty', '입력값: 필수 입력 항목입니다.'],
    ['a sentence the app has never seen', '입력한 내용을 다시 확인해 주세요.'],
  ])('"%s" → "%s"', (sentence, text) => {
    expect(errorMessage(new ApiError('validation', 400, [sentence]))).toBe(text);
  });

  it('no validation sentence ever reaches the screen in English', () => {
    const sentences = ['erpName should not be empty', 'quantity must be an integer number', 'whatever must be weird'];
    const text = errorMessage(new ApiError('validation', 400, sentences));
    expect(text).not.toMatch(/should|must/);
    expect(text).toMatch(/[가-힣]/);
  });

  it('no response at all is a network error', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'));
    expect(error.kind).toBe('network');
    expect(errorMessage(error)).toContain('네트워크');
  });

  it('a bug in our own code is not reported as a network problem', () => {
    const error = toApiError(new TypeError("Cannot read properties of undefined (reading 'map')"));
    expect(error.kind).toBe('unknown');
    expect(errorMessage(error)).not.toContain('네트워크');
    expect(errorMessage(error)).toBe('예기치 않은 오류가 발생했습니다. 화면을 새로고침한 후 다시 시도해 주세요.');
  });

  it('a non-JSON error body still gives a status-based message', () => {
    expect(toApiError(axiosFailure(500, null)).kind).toBe('server');
  });

  it.each([502, 503, 504, 521, 522, 530])('gateway %s (API server down) → "서버가 응답하지 않습니다"', (status) => {
    const error = toApiError(axiosFailure(status, null));
    expect(error.kind).toBe('unavailable');
    expect(errorMessage(error)).toBe('서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');
  });

  it('our proxy reporting the API unreachable reads the same', () => {
    expect(errorMessage(toApiError(axiosFailure(502, 'serverUnavailable')))).toBe('서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.');
  });

  it('an unknown business key shows the Korean text only, never the raw key', () => {
    const message = errorMessage(new ApiError('business', 400, ['somethingNew']));
    expect(message).toBe('요청을 처리하지 못했습니다.');
    expect(message).not.toContain('somethingNew');
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

describe('every API key seen on the QA server has Korean text (never a raw key on screen)', () => {
  it.each([
    'invalidPassword',
    'invalidCredentials',
    'productNotFound',
    'maximumCategoryLimitReached',
    'subCategoryAlreadyExists',
    'childSubcategoryAlreadyExists',
    'unitPriceMustBeLessThanPrice',
  ])('%s', (key) => {
    const text = errorMessage(toApiError(axiosFailure(400, key)));
    expect(text).not.toContain(key);
    expect(text).toMatch(/[가-힣]/);
  });
});
