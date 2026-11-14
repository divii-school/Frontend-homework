import { ApiError } from './api-error';

/**
 * API message keys → Korean text for the screen.
 * The API answers with keys ("invalidPassword"), not sentences, and WM's Error Message
 * List has no texts yet, so the Korean is ours. Keys seen on the QA server are marked ✔.
 */
const MESSAGES: Record<string, string> = {
  invalidPassword: '아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.', // ✔ Figma 비밀번호가 일치하지 않습니다
  invalidCredentials: '등록되지 않은 계정입니다.', // ✔ unknown ID — Figma 등록된 아이디가 아닙니다
  Unauthorized: '로그인이 필요합니다.', // ✔
  productNotFound: '상품을 찾을 수 없습니다.', // ✔
  maximumCategoryLimitReached: '대분류 개수가 최대치에 도달하여 새 대분류를 등록할 수 없습니다.', // ✔ isCreatable=false
  networkError: '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 후 다시 시도해 주세요.',
  serverUnavailable: '서버가 응답하지 않습니다. 잠시 후 다시 시도해 주세요.',
  invalidFileType: 'JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.',
  fileTooLarge: '이미지 용량이 너무 큽니다.',
  fileRequired: '업로드할 파일을 선택해 주세요.',
  uploadFailed: '이미지를 업로드하지 못했습니다. 다시 시도해 주세요.',
};

/** Fallback per kind, used when the API key is unknown. */
const BY_KIND: Record<ApiError['kind'], string> = {
  network: MESSAGES.networkError,
  unauthorized: '로그인이 만료되었습니다. 다시 로그인해 주세요.',
  forbidden: '이 기능을 사용할 권한이 없습니다.',
  notFound: '요청한 정보를 찾을 수 없습니다.',
  validation: '입력한 내용을 다시 확인해 주세요.',
  business: '요청을 처리하지 못했습니다.',
  unavailable: MESSAGES.serverUnavailable,
  server: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

/**
 * The text to show for an error.
 * Known key → Korean text. Validation sentences from the API ("name should not be empty")
 * are shown as the API wrote them, so the user sees exactly what the server refused.
 */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return BY_KIND.server;
  const known = error.apiMessages.map((m) => MESSAGES[m]).find(Boolean);
  if (known) return known;
  if (error.kind === 'validation' && error.apiMessages.length) return error.apiMessages.join('\n');
  if (error.kind === 'business' && error.apiMessages[0]) return `${BY_KIND.business} (${error.apiMessages[0]})`;
  return BY_KIND[error.kind];
}
