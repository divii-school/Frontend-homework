import { withObjectParticle } from "@/utils/korean";

/**
 * The API answers with message keys ("invalidPassword"), never with Korean text. These are the Korean sentences
 * shown for them. Login texts come from the Korean login frame (1.1.0); the others are ours, because
 * WM | Error Message List has no wording yet (docs/design-questions.md, Q13).
 * A key that is not listed here is never shown as it is: utils/api-messages.ts picks a Korean sentence by its
 * shape (…NotFound, …AlreadyExists) or by the HTTP status.
 */
export const API_MESSAGES: Record<string, string> = {
  // Login
  invalidCredentials: "등록되지 않은 계정입니다.",
  userNotFound: "등록되지 않은 계정입니다.",
  invalidPassword: "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
  Unauthorized: "아이디와 비밀번호가 일치하지 않습니다. 다시 확인해 주세요.",
  userSuspended: "관리자 권한이 없습니다. 고객센터로 문의해 주세요.",
  Forbidden: "이 작업을 할 권한이 없습니다.",
  // Products
  productNotFound: "상품을 찾을 수 없습니다.",
  productAlreadyExists: "같은 상품이 이미 등록되어 있습니다.",
  productCodeAlreadyExists: "이미 사용 중인 상품코드입니다.",
  erpCodeAlreadyExists: "이미 사용 중인 ERP 코드입니다.",
  unitPriceMustBeLessThanPrice: "단가는 판매가보다 낮아야 합니다.",
  // Categories
  categoryNotFound: "카테고리를 찾을 수 없습니다.",
  subCategoryNotFound: "중분류를 찾을 수 없습니다.",
  childCategoryNotFound: "소분류를 찾을 수 없습니다.",
  categoryAlreadyExists: "같은 이름의 대분류가 이미 있습니다.",
  subCategoryAlreadyExists: "같은 이름의 중분류가 이미 있습니다.",
  childCategoryAlreadyExists: "같은 이름의 소분류가 이미 있습니다.",
  maximumCategoryLimitReached: "카테고리를 더 이상 추가할 수 없습니다.",
  // Image upload (src/app/api/upload/route.ts)
  fileRequired: "업로드할 파일을 선택해 주세요.",
  invalidImage: "등록할 수 없는 이미지입니다. 형식과 크기를 확인해 주세요.",
  invalidRequest: "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
  uploadFailed: "이미지를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  // Generic answers of the server framework
  "Something went wrong": "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "Internal server error": "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  "Not Found": "요청한 정보를 찾을 수 없습니다.",
  "Bad Request": "요청을 처리하지 못했습니다. 입력한 내용을 확인해 주세요.",
};

/** Korean names of the request fields, used when the API's English validation sentences are translated. */
export const API_FIELD_LABELS: Record<string, string> = {
  loginId: "아이디",
  password: "비밀번호",
  productName: "상품명",
  productCode: "상품코드",
  erpName: "상품 ERP명",
  erpCode: "ERP 코드",
  erpUnitPrice: "ERP 단가",
  unitPrice: "단가",
  price: "판매가",
  quantity: "수량",
  taxType: "비과세",
  description: "상세설명",
  images: "이미지",
  categoryId: "대분류",
  subCategoryId: "중분류",
  childCategoryId: "소분류",
  isVisible: "노출상태",
  onSale: "판매상태",
  name: "카테고리 이름",
};

export const MESSAGES = {
  network: "서버에 연결할 수 없습니다. 네트워크 상태를 확인한 후 다시 시도해 주세요.",
  server: "서버에서 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  unknown: "요청을 처리하지 못했습니다. 다시 시도해 주세요.",
  notFound: "요청한 정보를 찾을 수 없습니다.",
  forbidden: "이 작업을 할 권한이 없습니다.",
  alreadyExists: "이미 등록된 값입니다. 다른 값으로 입력해 주세요.",
  limitReached: "허용된 개수를 넘어 더 이상 추가할 수 없습니다.",
  invalidValue: "입력한 값이 올바르지 않습니다. 다시 확인해 주세요.",
  checkInput: "입력한 내용을 확인해 주세요.",
  sessionExpired: "로그인이 만료되었습니다. 다시 로그인해 주세요.",
  noAdminRight: "관리자 권한이 없습니다.",
  contactSupport: "고객센터로 문의해 주세요.",
  required: (label: string) => `${withObjectParticle(label)} 입력해 주세요.`,
  selectRequired: (label: string) => `${withObjectParticle(label)} 선택해 주세요.`,
} as const;
