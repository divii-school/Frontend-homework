// API message keys → Korean text.
//
// talking-club-backend (release/qa) answers with plain keys (there are no i18n files on that branch):
// `throw new BadRequestException('productNotFound')`, `return { message: 'productDeletedSucessFully' }`.
// The spelling of the keys (Sucess, SuccessFull) is the backend's — keep it as is.
// Unknown keys fall back to the caller's fallback or to the Korean serverError text.

export const API_MESSAGES: Record<string, string> = {
  // ---- Auth (src/modules/auth/v1/auth.service.ts → authenticateCredentials) ----------------------
  invalidCredentials: "등록되지 않은 계정입니다.",
  invalidPassword: "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
  userSuspended: "이용이 정지된 계정입니다. 고객센터로 문의해 주세요.",
  userDeleted: "삭제된 계정입니다. 고객센터로 문의해 주세요.",
  tooManyRequests: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해 주세요.",
  Unauthorized: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  loginSuccess: "로그인되었습니다.",
  adminLogout: "로그아웃되었습니다.",
  noAdminPermission: "관리자 권한이 없습니다. 고객센터로 문의해주세요.",

  // ---- Generic (GlobalExceptionFilter / local) ----------------------------------------------------
  "You do not have permission to access this resource": "권한이 없습니다.",
  "Something went wrong": "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "Internal server error": "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "Validation Error": "표시된 항목을 다시 확인해 주세요.",
  networkError: "서버에 연결할 수 없습니다. 네트워크 연결을 확인한 후 다시 시도해 주세요.",
  requestTimeout: "서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
  sessionExpired: "세션이 만료되었습니다. 다시 로그인해 주세요.",
  forbidden: "권한이 없습니다.",
  notFound: "요청하신 데이터를 찾을 수 없습니다.",
  serverError: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  noRecordFound: "조회된 데이터가 없습니다.",

  // ---- Product categories (src/modules/product-categories/v1/category.service.ts) ---------------
  categoryAlreadyExists: "이미 존재하는 대분류 카테고리입니다.",
  subCategoryAlreadyExists: "이미 존재하는 중분류 카테고리입니다.",
  childSubcategoryAlreadyExists: "이미 존재하는 소분류 카테고리입니다.",
  maximumCategoryLimitReached: "대분류는 최대 3개까지 등록할 수 있습니다.",
  categoryNotFound: "존재하지 않는 대분류 카테고리입니다.",
  subCategoryNotFound: "존재하지 않는 중분류 카테고리입니다.",
  childSubcategoryNotFound: "존재하지 않는 소분류 카테고리입니다.",
  categoryAddedSucessFully: "대분류가 등록되었습니다.",
  categoryUpdatedSucessFully: "대분류가 수정되었습니다.",
  categoryDeletedSuccessFull: "대분류가 삭제되었습니다.",
  subCategoryAddedSucessFully: "중분류가 등록되었습니다.",
  subCategoryUpdatedSucessFully: "중분류가 수정되었습니다.",
  subCategoryDeletedSuccessFull: "중분류가 삭제되었습니다.",
  childSubcategoryAddedSucessFully: "소분류가 등록되었습니다.",
  childSubcategoryUpdatedSucessFully: "소분류가 수정되었습니다.",
  childSubcategoryDeletedSuccessFull: "소분류가 삭제되었습니다.",
  orderSwappedSuccessfully: "카테고리 순서가 변경되었습니다.",

  // ---- Products (src/modules/products/v1/product.service.ts) ------------------------------------
  productNotFound: "존재하지 않는 상품입니다.",
  unitPriceMustBeLessThanPrice: "단가는 판매가보다 낮아야 합니다.",
  someProductDoesNotExist: "선택한 옵션 상품 중 존재하지 않는 상품이 있습니다.",
  productOptionsRequired: "옵션을 1개 이상 추가해 주세요.",
  // The backend answers productCreatedSucessFully for both add AND edit — screens pick their own text.
  productCreatedSucessFully: "상품이 저장되었습니다.",
  productDeletedSucessFully: "상품이 삭제되었습니다.",
  productStatusUpdatedSuccessfully: "노출상태가 변경되었습니다.",
  erpCodeAlreadyExists: "이미 등록된 ERP 코드입니다.",
  erpCodeAvailable: "사용 가능한 ERP 코드입니다.",
  "At least one image is required": "이미지를 1장 이상 등록해 주세요.",

  // ---- Upload (src/modules/utils/v1 → POST /utils/upload-file-urls) ------------------------------
  urlGeneratedSuccessfully: "업로드 URL이 생성되었습니다.",
  fileFormatNotAllowed: "허용되지 않는 파일 형식입니다.",
  FileSizeExceeded: "파일 용량이 너무 큽니다.",
  uploadFailed: "이미지 업로드에 실패했습니다. 다시 시도해 주세요.",
  // ---- Upload, this app's own server route (src/app/api/upload/route.ts) --------------------------
  uploadTooLarge: "이미지 용량이 너무 커서 업로드할 수 없습니다. 더 작은 파일을 선택해 주세요.",
  uploadUrlNotAllowed: "업로드 주소가 올바르지 않습니다. 다시 시도해 주세요.",
};

/** Korean text for an API message key. Never shows English: unknown keys and sentences use the fallback. */
export function getApiMessage(key: string | null | undefined, fallback?: string): string {
  if (!key) return fallback ?? API_MESSAGES.serverError;
  if (Object.prototype.hasOwnProperty.call(API_MESSAGES, key)) return API_MESSAGES[key];
  // Unknown keys and class-validator sentences are English, so they are not shown.
  return fallback ?? API_MESSAGES.serverError;
}
