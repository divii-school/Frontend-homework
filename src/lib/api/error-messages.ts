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
  unitPriceMustBeLessThanPrice: '단가는 판매가보다 작아야 합니다.', // ✔ same text as the form's own check
  // 8.2.0 "no duplicate names": the API refuses a name already used at that level (case-insensitive).
  categoryAlreadyExists: '이미 등록된 대분류명입니다. 다른 이름을 입력해 주세요.', // top level is capped, so not reachable today
  subCategoryAlreadyExists: '이미 등록된 중분류명입니다. 다른 이름을 입력해 주세요.', // ✔
  childSubcategoryAlreadyExists: '이미 등록된 소분류명입니다. 다른 이름을 입력해 주세요.', // ✔
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
  unknown: '예기치 않은 오류가 발생했습니다. 화면을 새로고침한 후 다시 시도해 주세요.',
};

/** API field names → the Korean label the screen shows for that field. */
const FIELD_LABELS: Record<string, string> = {
  loginId: '아이디',
  password: '비밀번호',
  productName: '상품명',
  productCode: '상품코드',
  price: '판매가',
  unitPrice: '단가',
  description: '상세설명',
  erpCode: 'ERP 코드',
  erpName: '상품ERP명',
  erpUnitPrice: 'ERP 단가',
  quantity: '수량',
  taxType: '과세 구분',
  categoryId: '대분류',
  subCategoryId: '중분류',
  childCategoryId: '소분류',
  images: '상품 이미지',
  isOptions: '옵션 사용',
  isVisible: '노출여부',
  onSale: '판매상태',
  name: '카테고리명',
  ids: '선택한 항목',
  search: '검색어',
  type: '검색 구분',
  page: '페이지',
  limit: '페이지당 개수',
};

/**
 * The API's validation sentences (class-validator defaults, in English) → Korean.
 * Written as "<label>: <rule>" so no Korean particle (을/를) has to be guessed.
 */
const VALIDATION_RULES: { pattern: RegExp; text: (n?: string) => string }[] = [
  { pattern: /^(?:each value in )?(\S+) should not be empty$/, text: () => '필수 입력 항목입니다.' },
  { pattern: /^(?:each value in )?(\S+) must be a string$/, text: () => '문자로 입력해 주세요.' },
  { pattern: /^(?:each value in )?(\S+) must be an integer number$/, text: () => '정수로 입력해 주세요.' },
  { pattern: /^(?:each value in )?(\S+) must be a number\b.*$/, text: () => '숫자로 입력해 주세요.' },
  { pattern: /^(?:each value in )?(\S+) must be a positive number$/, text: () => '0보다 큰 값을 입력해 주세요.' },
  { pattern: /^(?:each value in )?(\S+) must not be less than (\S+)$/, text: (n) => `${n} 이상으로 입력해 주세요.` },
  { pattern: /^(?:each value in )?(\S+) must not be greater than (\S+)$/, text: (n) => `${n} 이하로 입력해 주세요.` },
  { pattern: /^(\S+) must be longer than or equal to (\d+) characters$/, text: (n) => `${n}자 이상 입력해 주세요.` },
  { pattern: /^(\S+) must be shorter than or equal to (\d+) characters$/, text: (n) => `${n}자 이하로 입력해 주세요.` },
  { pattern: /^(\S+) must be one of the following values: .*$/, text: () => '선택할 수 없는 값입니다.' },
  { pattern: /^(\S+) must be an array$/, text: () => '목록 형식이 올바르지 않습니다.' },
  { pattern: /^property (\S+) should not exist$/, text: () => '허용되지 않는 항목입니다.' },
];

/** One API validation sentence in Korean; an unrecognised sentence gets the generic Korean text. */
export function validationSentenceToKorean(sentence: string): string {
  for (const rule of VALIDATION_RULES) {
    const match = rule.pattern.exec(sentence.trim());
    if (match) {
      // Nested paths ("images.0.url") are labelled by their last named part.
      const field = match[1].split('.').filter((part) => !/^\d+$/.test(part)).pop() ?? match[1];
      return `${FIELD_LABELS[field] ?? '입력값'}: ${rule.text(match[2])}`;
    }
  }
  return BY_KIND.validation;
}

/**
 * The text to show for an error.
 * Known key → Korean text. Validation sentences from the API ("name should not be empty") are
 * English, so each is turned into Korean ("카테고리명: 필수 입력 항목입니다."); a sentence we do
 * not recognise becomes the generic Korean "입력한 내용을 다시 확인해 주세요."
 */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return BY_KIND.unknown;
  const known = error.apiMessages.map((m) => MESSAGES[m]).find(Boolean);
  if (known) return known;
  if (error.kind === 'validation' && error.apiMessages.length) {
    return [...new Set(error.apiMessages.map(validationSentenceToKorean))].join('\n');
  }
  if (error.kind === 'business' && error.apiMessages[0]) return `${BY_KIND.business} (${error.apiMessages[0]})`;
  return BY_KIND[error.kind];
}
