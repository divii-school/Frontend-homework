export interface CategoryRef {
  id: number;
  name: string;
}

/** One row of GET /api/v1/products (fields the list screen uses). Confirmed on QA 2026-11-16. */
export interface ProductListItem {
  id: number;
  productName: string;
  productCode: string;
  price: number;
  isVisible: boolean;
  /** Public S3 URL of the main image, or null. */
  image: string | null;
  category: CategoryRef | null;
  subCategory: CategoryRef | null;
  childCategory: CategoryRef | null;
  createdAt: string;
}

/** The API's `type` filter: what the search term is matched against. */
export type ProductSearchType = "productName" | "categoryName";

export interface ProductListParams {
  page: number;
  search: string;
  type: ProductSearchType;
}

/** Figma 8.1.0: 10 rows per page; at most 100 rows selected at once. */
export const PRODUCT_PAGE_SIZE = 10;
export const PRODUCT_SELECTION_MAX = 100;
