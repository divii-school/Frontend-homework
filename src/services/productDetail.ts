import { z } from "zod";
import { pagedRequest, type PagedResult } from "@/services/http";

/** Rows per page inside the detail tabs. */
export const DETAIL_TAB_PAGE_SIZE = 10;

// GET /api/v1/session-products?productId=…  (confirmed on QA 2026-11-17)
const sessionRowSchema = z.object({
  id: z.number(),
  bookType: z.string().nullable().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  session: z.object({ id: z.number(), title: z.string() }).nullable().optional(),
});
export type ProductSessionRow = z.infer<typeof sessionRowSchema>;

// GET /api/v1/products/get-products-by-category?childCategoryId=…  (confirmed on QA 2026-11-17)
const relatedRowSchema = z.object({
  id: z.number(),
  productName: z.string(),
  productCode: z.string().nullable().optional(),
  price: z.number(),
  isVisible: z.boolean(),
  onSale: z.boolean(),
  isDeleted: z.boolean().optional(),
});
export type RelatedProductRow = z.infer<typeof relatedRowSchema>;

export const productDetailService = {
  /** Which class sessions (levels) sell this product. */
  async sessions(productId: number, page: number, signal?: AbortSignal): Promise<PagedResult<ProductSessionRow>> {
    const result = await pagedRequest("/api/v1/session-products", {
      query: { page, limit: DETAIL_TAB_PAGE_SIZE, productId },
      signal,
    });
    return { ...result, rows: z.array(sessionRowSchema).parse(result.rows) };
  },

  /** Other products in the same minor category. */
  async sameCategory(childCategoryId: number, page: number, signal?: AbortSignal): Promise<PagedResult<RelatedProductRow>> {
    const result = await pagedRequest("/api/v1/products/get-products-by-category", {
      query: { page, limit: DETAIL_TAB_PAGE_SIZE, childCategoryId },
      signal,
    });
    return { ...result, rows: z.array(relatedRowSchema).parse(result.rows).filter((row) => !row.isDeleted) };
  },
};
