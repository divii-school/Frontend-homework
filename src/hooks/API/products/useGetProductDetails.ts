"use client";

import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import type { ProductDetails } from "@/api-services/ProductService.types";
import type { ApiError } from "@/types/api";
import { queryKeys } from "@/utils/query-keys";

/**
 * One product (details page tabs, edit form). Disabled until `id` is a positive number.
 * A missing / deleted product rejects with ApiError kind 'not-found' (messageKey productNotFound).
 */
export function useGetProductDetails(id: number | null | undefined) {
  const valid = typeof id === "number" && Number.isInteger(id) && id > 0;
  return useQuery<ProductDetails, ApiError>({
    queryKey: queryKeys.products.details(valid ? id : 0),
    queryFn: ({ signal }) => ProductService.getDetails(id as number, signal),
    enabled: valid,
  });
}
