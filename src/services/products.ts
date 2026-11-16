import { z } from "zod";
import { pagedRequest, request, type PagedResult } from "@/services/http";
import { PRODUCT_PAGE_SIZE, type ProductListItem, type ProductListParams } from "@/types/product";

// GET /api/v1/products?page&limit&type&search → { data: [...], totalRecords, totalPage, page }
// The API has no sort parameters (sortBy/order/orderBy were tried on QA and ignored).
const categoryRef = z.object({ id: z.number(), name: z.string() }).nullable().optional();

const rowSchema = z.object({
  id: z.number(),
  productName: z.string(),
  productCode: z.string().nullable().optional(),
  price: z.number(),
  isVisible: z.boolean(),
  image: z.string().nullable().optional(),
  category: categoryRef,
  subCategory: categoryRef,
  childCategory: categoryRef,
  createdAt: z.string(),
  isDeleted: z.boolean().optional(),
});

/**
 * API bug (QA 2026-11-16): `type=categoryName` searches also return soft-deleted products
 * (isDeleted: true); `productName` searches don't. Deleted rows are dropped here. The server's
 * totalRecords still counts them, so totals on a category search can be slightly high.
 */
const live = (rows: z.infer<typeof rowSchema>[]) => rows.filter((row) => !row.isDeleted);

function toItem(raw: z.infer<typeof rowSchema>): ProductListItem {
  return {
    id: raw.id,
    productName: raw.productName,
    productCode: raw.productCode ?? "",
    price: raw.price,
    isVisible: raw.isVisible,
    image: raw.image || null,
    category: raw.category ?? null,
    subCategory: raw.subCategory ?? null,
    childCategory: raw.childCategory ?? null,
    createdAt: raw.createdAt,
  };
}

function filterQuery({ search, type }: Pick<ProductListParams, "search" | "type">) {
  const term = search.trim();
  return term ? { type, search: term } : {};
}

/** Export reads the whole filtered result in one request; this caps it. */
const EXPORT_MAX = 5000;

export const productService = {
  async list(params: ProductListParams, signal?: AbortSignal): Promise<PagedResult<ProductListItem>> {
    const result = await pagedRequest("/api/v1/products", {
      query: { page: params.page, limit: PRODUCT_PAGE_SIZE, ...filterQuery(params) },
      signal,
    });
    return { ...result, rows: live(z.array(rowSchema).parse(result.rows)).map(toItem) };
  },

  /** Every row matching the current search (for export). */
  async listAll(filter: Pick<ProductListParams, "search" | "type">, total: number): Promise<ProductListItem[]> {
    const result = await pagedRequest("/api/v1/products", {
      query: { page: 1, limit: Math.min(Math.max(total, 1), EXPORT_MAX), ...filterQuery(filter) },
    });
    return live(z.array(rowSchema).parse(result.rows)).map(toItem);
  },

  /** DELETE /api/v1/products/delete with { ids: number[] } (ids must be numbers). */
  async remove(ids: number[]): Promise<void> {
    await request<unknown>("/api/v1/products/delete", { method: "DELETE", body: { ids } });
  },

  /**
   * PUT /api/v1/products/update-status/{id}/{status}.
   * TODO(HW3): confirm the status value on a HW3-Sandip product; "yes"/"no" matches the add/edit DTO.
   */
  async setVisible(id: number, visible: boolean): Promise<void> {
    await request<unknown>(`/api/v1/products/update-status/${id}/${visible ? "yes" : "no"}`, { method: "PUT" });
  },
};
