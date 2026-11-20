import { ApiError } from "@/services/http";

/**
 * Error text shown to the user — always Korean, never the API's raw key or English sentence
 * (Kakali, HW3 TL page, 2026-11-18: "show a proper Korean message, never crash or show raw keys").
 *
 * 1. A known API code (`message` in the API envelope) → its own message.
 * 2. Otherwise → a message chosen by HTTP status.
 * 3. Anything else (unexpected response shape, our own bugs) → a general message.
 */
const BY_CODE: Record<string, string> = {
  invalidCredentials: "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
  Unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  productNotFound: "상품을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.",
  productCodeAlreadyExists: "이미 사용 중인 상품 코드입니다. 페이지를 새로 고친 뒤 다시 등록해 주세요.",
  erpCodeAlreadyExists: "이미 사용 중인 ERP 코드입니다.",
  categoryAlreadyExists: "이미 같은 이름의 대분류가 있습니다. 다른 이름을 입력해 주세요.",
  subCategoryAlreadyExists: "이미 같은 이름의 중분류가 있습니다. 다른 이름을 입력해 주세요.",
  childSubcategoryAlreadyExists: "이미 같은 이름의 소분류가 있습니다. 다른 이름을 입력해 주세요.",
  maximumCategoryLimitReached: "카테고리를 더 등록할 수 없습니다. 등록 가능한 최대 개수에 도달했습니다.",
  unitPriceMustBeLessThanPrice: "단가는 판매가보다 작아야 합니다. 금액을 확인해 주세요.",
  fileRequired: "이미지 파일을 선택해 주세요.",
};

export const ERROR_TEXT = {
  network: "네트워크 오류가 발생했습니다. 연결을 확인한 뒤 다시 시도해 주세요.",
  badRequest: "요청을 처리하지 못했습니다. 입력한 내용을 확인해 주세요.",
  unauthorized: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  forbidden: "이 작업을 할 권한이 없습니다.",
  notFound: "요청한 항목을 찾을 수 없습니다.",
  tooLarge: "이미지는 3MB 이하만 올릴 수 있습니다.",
  unsupportedType: "JPG, PNG, WebP 이미지만 올릴 수 있습니다.",
  server: "서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  unknown: "요청을 처리하지 못했습니다.",
} as const;

function byStatus(status: number): string {
  if (status === 0) return ERROR_TEXT.network;
  if (status === 401) return ERROR_TEXT.unauthorized;
  if (status === 403) return ERROR_TEXT.forbidden;
  if (status === 404) return ERROR_TEXT.notFound;
  if (status === 413) return ERROR_TEXT.tooLarge;
  if (status === 415) return ERROR_TEXT.unsupportedType;
  if (status >= 500) return ERROR_TEXT.server;
  if (status >= 400) return ERROR_TEXT.badRequest;
  return ERROR_TEXT.unknown;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && Object.hasOwn(BY_CODE, error.code)) return BY_CODE[error.code];
    return byStatus(error.status);
  }
  return ERROR_TEXT.unknown;
}
