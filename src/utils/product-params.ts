import { DEFAULT_PRODUCT_PARAMS, PAGE_SIZE_OPTIONS, SORT_FIELDS } from "@/constants/products";
import type { Product, ProductListParams, ProductSortField, SortOrder } from "@/types/product";

type Readable = { get(name: string): string | null };

const positiveInt = (value: string | null): number | null => {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/** Read the list state from the URL. Anything missing or invalid falls back to the default, so a hand-typed URL never breaks the page. */
export function parseProductParams(query: Readable): ProductListParams {
  const limit = positiveInt(query.get("limit"));
  const sort = query.get("sort") as ProductSortField | null;
  return {
    page: positiveInt(query.get("page")) ?? DEFAULT_PRODUCT_PARAMS.page,
    limit: limit && (PAGE_SIZE_OPTIONS as readonly number[]).includes(limit) ? limit : DEFAULT_PRODUCT_PARAMS.limit,
    search: (query.get("search") ?? "").trim(),
    type: query.get("type") === "categoryName" ? "categoryName" : "productName",
    categoryId: positiveInt(query.get("categoryId")),
    sort: sort && SORT_FIELDS.includes(sort) ? sort : DEFAULT_PRODUCT_PARAMS.sort,
    order: query.get("order") === "asc" ? "asc" : "desc",
  };
}

/** Write the list state back as a query string. Defaults are left out to keep the URL short. */
export function toProductQuery(params: ProductListParams): string {
  const query = new URLSearchParams();
  (Object.keys(params) as (keyof ProductListParams)[]).forEach((key) => {
    const value = params[key];
    if (value !== null && value !== "" && value !== DEFAULT_PRODUCT_PARAMS[key]) query.set(key, String(value));
  });
  return query.toString();
}

/**
 * The products API has no sort parameter, so the rows of the current page are ordered here.
 * (Raised as an API question in docs/design-questions.md.)
 */
export function sortProducts(items: Product[], sort: ProductSortField, order: SortOrder): Product[] {
  const direction = order === "asc" ? 1 : -1;
  return [...items].sort((a, b) => {
    const result = sort === "price" ? a.price - b.price : String(a[sort]).localeCompare(String(b[sort]), "ko");
    return result * direction;
  });
}
