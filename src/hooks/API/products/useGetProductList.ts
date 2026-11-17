"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import type { Product, ProductListQuery } from "@/api-services/ProductService.types";
import type { ApiError, PaginatedResult } from "@/types/api";
import { queryKeys } from "@/utils/query-keys";

/**
 * Product list for 8.1.0. `searchType: 'productName'` → list A (name + category filters + type),
 * `searchType: 'categoryName'` → list B (search by category name). Server order is id DESC;
 * the previous page stays on screen while the next one loads.
 */
export function useGetProductList(query: ProductListQuery, options: { enabled?: boolean } = {}) {
  return useQuery<PaginatedResult<Product>, ApiError>({
    queryKey: queryKeys.products.list(query),
    queryFn: ({ signal }) => ProductService.getProductList(query, signal),
    placeholderData: keepPreviousData,
    // e.g. the details "Same category" tab waits until the product's minor category is known
    enabled: options.enabled ?? true,
  });
}
