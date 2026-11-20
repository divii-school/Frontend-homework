/**
 * The QA API refuses a new 대분류 with `maximumCategoryLimitReached` (checked 2026-11-20:
 * POST /api/v1/product-category/add → 400, nothing created). The API has no endpoint that tells
 * the limit, so 대분류 등록 is shown disabled with the reason (design review 2026-11-20, should-fix 4).
 * Set to false when the API allows new main categories again.
 */
export const MAIN_CATEGORY_LIMIT_REACHED = true;

export const MAIN_CATEGORY_LIMIT_NOTE = "대분류는 등록 가능한 최대 개수에 도달해 더 등록할 수 없습니다.";
