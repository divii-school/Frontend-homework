import { useQuery } from "@tanstack/react-query";
import { ProductService } from "@/api-services/ProductService";
import { RELATED_PRODUCTS_LIMIT } from "@/constants/products";
import type { ApiError, PagedResult } from "@/types/api";
import type { Product } from "@/types/product";
import { QUERIES } from "@/utils/api-integration";

/** One product. `enabled` lets a tab or the edit form decide when to load. */
export function useGetProductDetails(id: number, enabled = true) {
  return useQuery<Product, ApiError>({
    queryKey: QUERIES.products.details(id),
    queryFn: () => ProductService.details(id),
    enabled: enabled && Number.isInteger(id) && id > 0,
  });
}

/** Products of the same 소분류, for the third tab of the details page. Loads only when that tab is open. */
export function useGetRelatedProducts(childCategoryId: number | null, enabled: boolean) {
  return useQuery<PagedResult<Product>, ApiError>({
    queryKey: QUERIES.products.related(childCategoryId ?? 0),
    queryFn: () => ProductService.related(childCategoryId as number, RELATED_PRODUCTS_LIMIT),
    enabled: enabled && childCategoryId !== null,
  });
}

/** A new product code from the server, asked once when the create form opens. */
export function useGenerateProductCode(enabled: boolean) {
  return useQuery<string, ApiError>({
    queryKey: QUERIES.products.code,
    queryFn: ProductService.generateCode,
    enabled,
    // One code per visit of the create screen: not fetched again while the form is open (a new code would not
    // reach the form anyway), and dropped when the screen closes, so the next visit asks for a new one.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnReconnect: false,
  });
}
