import type { ProductListParams, ProductSearchType, ProductSortField, TaxType } from "@/types/product";

export const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export const DEFAULT_PRODUCT_PARAMS: ProductListParams = {
  page: 1,
  limit: 10,
  search: "",
  type: "productName",
  categoryId: null,
  sort: "createdAt",
  order: "desc",
};

export const SEARCH_TYPE_OPTIONS: { label: string; value: ProductSearchType }[] = [
  { label: "상품명", value: "productName" },
  { label: "카테고리명", value: "categoryName" },
];

export const SORT_FIELDS: readonly ProductSortField[] = ["createdAt", "productName", "price"];

/** Design 8.1.1: the field is called 비과세 and lists 비과세 first. */
export const TAX_TYPE_OPTIONS: { label: string; value: TaxType }[] = [
  { label: "비과세", value: "tax_free" },
  { label: "과세", value: "tax" },
];

/** 노출상태 and 판매상태 are 예 / 아니오 dropdowns in the form (design 8.1.1). */
export const YES_NO_OPTIONS: { label: string; value: boolean }[] = [
  { label: "예", value: true },
  { label: "아니오", value: false },
];

/** Design 8.1.1, rule 2: 상품명 is at most 100 characters. */
export const PRODUCT_NAME_MAX_LENGTH = 100;

export const TOAST_LIFE_MS = 4_000;

/**
 * Image rules of the product form. Count and size hint come from the live admin ("최대 4장", 800x800).
 * 4 MB per file: the upload passes through this app's server route, and Vercel accepts request bodies up to 4.5 MB.
 */
export const IMAGE_RULES = {
  maxCount: 4,
  maxBytes: 4 * 1024 * 1024,
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
  accept: "image/png,image/jpeg,image/webp",
  uploadLocation: "products",
} as const;

/** The export reads the filtered result page by page with the largest page the API accepts. */
export const EXPORT_PAGE_SIZE = 100;
export const EXPORT_MAX_PAGES = 50;

export const PRODUCT_FORM_STEPS = [
  { key: "basic", label: "기본 정보" },
  { key: "price", label: "가격·수량" },
  { key: "category", label: "카테고리" },
  { key: "media", label: "이미지·노출" },
] as const;

export const PRODUCT_TABS = [
  { key: "info", label: "기본 정보" },
  { key: "category", label: "카테고리" },
  { key: "related", label: "같은 카테고리 상품" },
] as const;
export type ProductTabKey = (typeof PRODUCT_TABS)[number]["key"];

/** How many rows the "same category" tab shows. */
export const RELATED_PRODUCTS_LIMIT = 10;
