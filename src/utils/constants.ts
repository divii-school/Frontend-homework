// App-wide constants: limits that mirror the API, paging defaults, shared-data naming rule.

/** Default rows per page (design 8.1.0: 10 per page) and the choices the list offers. */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

/** Debounce for search boxes that query while typing. */
export const SEARCH_DEBOUNCE_MS = 400;

/**
 * Shared QA DB rule (5 developers): every record this app creates is named with this prefix,
 * and only records with it may be edited / deleted by tests.
 */
export const HW3_RECORD_PREFIX = "HW3-Neeraj-";

/** Category names (8.2.0): required, trimmed, ≤ 50 chars; duplicates are rejected by the API. */
export const CATEGORY_RULES = {
  nameMaxLength: 50,
  /** The API refuses a 4th top-level category (maximumCategoryLimitReached). */
  maxTopLevel: 3,
} as const;

/** Product rules from the API DTO + design 8.1.0 / 8.1.1. */
export const PRODUCT_RULES = {
  /** List selection limit (design 8.1.0 ⑤). */
  maxSelection: 100,
  images: {
    min: 1,
    max: 4,
    maxSizeMB: 10,
    accept: ["image/jpeg", "image/png", "image/gif", "image/webp"] as readonly string[],
    acceptExtensions: ["jpg", "jpeg", "png", "gif", "webp"] as readonly string[],
  },
} as const;

/** S3 folder the product images go to (POST /utils/upload-file-urls `location`). */
export const PRODUCT_UPLOAD_LOCATION = "products";

/** Customer center number on the no-admin-permission popup (design 17108:76615). */
export const CUSTOMER_CENTER_PHONE = "02-2014-8374";
