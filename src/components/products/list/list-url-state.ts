import type { Product, ProductListQuery, ProductSearchType, ProductType } from "@/api-services/ProductService.types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/utils/constants";

// =====================================================================================
// The product list keeps ALL of its state in the URL query string, e.g.
//   /shopping-mall/products?page=2&limit=20&q=ace&categoryId=3&productType=MAIN&sort=price&order=asc
//
//  - parseListParams()  URL → typed object. Anything invalid falls back to its default
//                        (?page=abc → 1, ?limit=7 → 10, ?productType=FOO → all).
//  - toSearchString()   typed object → URL. Default values are left out, so links stay short.
//  - toApiQuery()       typed object → what useGetProductList() sends to the API.
//
// Because nothing lives only in React memory, refresh, back/forward and a shared link all show
// exactly the same list.
// =====================================================================================

export type SortField = "name" | "price" | "date";
export type SortOrder = "asc" | "desc";

export interface ProductListUrlState {
  /** 1-based, same as the API. */
  page: number;
  limit: number;
  q: string;
  searchType: ProductSearchType;
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  productType: ProductType | null;
  /** null = the API order (newest first). */
  sort: SortField | null;
  order: SortOrder;
}

export const DEFAULT_LIST_STATE: ProductListUrlState = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  q: "",
  searchType: "productName",
  categoryId: null,
  subCategoryId: null,
  childCategoryId: null,
  productType: null,
  sort: null,
  order: "asc",
};

/** Longer search terms are cut (the API LIKE-searches the whole string). */
export const MAX_SEARCH_LENGTH = 100;

const SEARCH_TYPES: readonly ProductSearchType[] = ["productName", "categoryName"];
const PRODUCT_TYPES: readonly ProductType[] = ["MAIN", "SUPPLEMENTARY"];
const SORT_FIELDS: readonly SortField[] = ["name", "price", "date"];
const SORT_ORDERS: readonly SortOrder[] = ["asc", "desc"];

/** Anything with get() — URLSearchParams and Next's ReadonlyURLSearchParams both fit. */
interface ParamReader {
  get(name: string): string | null;
}

/** "12" → 12; "", "0", "-3", "1.5", "abc" → null. */
function positiveInt(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const numeric = Number(value);
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

// ---- URL → state ---------------------------------------------------------------------------
export function parseListParams(params: ParamReader): ProductListUrlState {
  const searchType = oneOf(params.get("searchType"), SEARCH_TYPES) ?? DEFAULT_LIST_STATE.searchType;
  const limit = positiveInt(params.get("limit"));
  const sort = oneOf(params.get("sort"), SORT_FIELDS);

  // Category filters + product type only exist for the product-name search (list A), and the
  // categories must form a chain: a minor category needs its medium, a medium needs its major.
  const byProductName = searchType === "productName";
  const categoryId = byProductName ? positiveInt(params.get("categoryId")) : null;
  const subCategoryId = categoryId !== null ? positiveInt(params.get("subCategoryId")) : null;
  const childCategoryId = subCategoryId !== null ? positiveInt(params.get("childCategoryId")) : null;

  return {
    page: positiveInt(params.get("page")) ?? DEFAULT_LIST_STATE.page,
    limit: limit !== null && (PAGE_SIZE_OPTIONS as readonly number[]).includes(limit) ? limit : DEFAULT_PAGE_SIZE,
    q: (params.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    searchType,
    categoryId,
    subCategoryId,
    childCategoryId,
    productType: byProductName ? oneOf(params.get("productType"), PRODUCT_TYPES) : null,
    sort,
    order: sort ? (oneOf(params.get("order"), SORT_ORDERS) ?? "asc") : DEFAULT_LIST_STATE.order,
  };
}

// ---- state → URL ---------------------------------------------------------------------------
/** Fixed key order, defaults left out: `page=2&q=ace&sort=price&order=desc`. */
export function toSearchString(state: ProductListUrlState): string {
  const params = new URLSearchParams();
  if (state.page !== DEFAULT_LIST_STATE.page) params.set("page", String(state.page));
  if (state.limit !== DEFAULT_LIST_STATE.limit) params.set("limit", String(state.limit));
  if (state.q) params.set("q", state.q);
  if (state.searchType !== DEFAULT_LIST_STATE.searchType) params.set("searchType", state.searchType);
  if (state.categoryId !== null) params.set("categoryId", String(state.categoryId));
  if (state.subCategoryId !== null) params.set("subCategoryId", String(state.subCategoryId));
  if (state.childCategoryId !== null) params.set("childCategoryId", String(state.childCategoryId));
  if (state.productType !== null) params.set("productType", state.productType);
  if (state.sort !== null) {
    params.set("sort", state.sort);
    params.set("order", state.order);
  }
  return params.toString();
}

// ---- state → API query ---------------------------------------------------------------------
/** What useGetProductList() gets. `searchType` decides the endpoint (list A or list B). */
export function toApiQuery(state: ProductListUrlState): ProductListQuery {
  return {
    page: state.page,
    limit: state.limit,
    searchType: state.searchType,
    search: state.q || undefined,
    categoryId: state.categoryId ?? undefined,
    subCategoryId: state.subCategoryId ?? undefined,
    childCategoryId: state.childCategoryId ?? undefined,
    productType: state.productType ?? undefined,
  };
}

/** True when a search or filter narrows the list ("Reset filters" is useful). */
export function hasActiveFilters(state: ProductListUrlState): boolean {
  return (
    state.q !== "" ||
    state.searchType !== DEFAULT_LIST_STATE.searchType ||
    state.categoryId !== null ||
    state.productType !== null
  );
}

// ---- Sort ----------------------------------------------------------------------------------
// The QA API has no sort parameter (always id DESC), so the list sorts the rows it has:
// the current page on screen, or every exported row in the CSV.
const COMPARE: Record<SortField, (a: Product, b: Product) => number> = {
  name: (a, b) => (a.productName ?? "").localeCompare(b.productName ?? "", "ko", { numeric: true, sensitivity: "base" }),
  price: (a, b) => Number(a.unitPrice ?? 0) - Number(b.unitPrice ?? 0),
  date: (a, b) => (Date.parse(a.createdAt) || 0) - (Date.parse(b.createdAt) || 0),
};

export function sortProducts(rows: readonly Product[], sort: SortField | null, order: SortOrder): Product[] {
  if (!sort) return [...rows];
  const direction = order === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => COMPARE[sort](a, b) * direction);
}

/** Header click cycle: not sorted → ascending → descending → back to the API order. */
export function nextSort(state: Pick<ProductListUrlState, "sort" | "order">, field: SortField): Pick<ProductListUrlState, "sort" | "order"> {
  if (state.sort !== field) return { sort: field, order: "asc" };
  if (state.order === "asc") return { sort: field, order: "desc" };
  return { sort: null, order: "asc" };
}
