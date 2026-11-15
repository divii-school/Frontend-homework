import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductService } from "@/api-services/ProductService";
import { UploadService } from "@/api-services/UploadService";
import { EXPORT_MAX_PAGES, EXPORT_PAGE_SIZE } from "@/constants/products";
import type { ApiError } from "@/types/api";
import type { Product, ProductImage, ProductListParams, ProductRequest } from "@/types/product";
import { QUERIES } from "@/utils/api-integration";
import { sortProducts } from "@/utils/product-params";

/** After any write every product list and details is refetched, so the screen shows what the server has. */
function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERIES.products.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation<void, ApiError, ProductRequest>({ mutationFn: ProductService.create, onSuccess: invalidate });
}

export function useUpdateProduct(id: number) {
  const invalidate = useInvalidateProducts();
  return useMutation<void, ApiError, ProductRequest>({
    mutationFn: (request) => ProductService.update(id, request),
    onSuccess: invalidate,
  });
}

/** Bulk delete: one request for all selected rows. */
export function useDeleteProducts() {
  const invalidate = useInvalidateProducts();
  return useMutation<void, ApiError, number[]>({ mutationFn: ProductService.removeMany, onSuccess: invalidate });
}

export function useSetProductVisible() {
  const invalidate = useInvalidateProducts();
  return useMutation<void, ApiError, { id: number; visible: boolean }>({
    mutationFn: ({ id, visible }) => ProductService.setVisible(id, visible),
    onSuccess: invalidate,
  });
}

export function useUploadProductImage() {
  return useMutation<ProductImage, ApiError, File>({ mutationFn: UploadService.uploadImage });
}

/**
 * Every row of the current filter (not only the page on screen), read page by page.
 * A mutation, not a query: it runs once per click and its result is not cached.
 */
export function useExportProducts() {
  return useMutation<Product[], ApiError, ProductListParams>({
    mutationFn: async (params) => {
      const rows: Product[] = [];
      for (let page = 1; page <= EXPORT_MAX_PAGES; page += 1) {
        const result = await ProductService.list({ ...params, page, limit: EXPORT_PAGE_SIZE });
        rows.push(...result.items);
        if (page >= result.totalPages) break;
      }
      return sortProducts(rows, params.sort, params.order);
    },
  });
}
