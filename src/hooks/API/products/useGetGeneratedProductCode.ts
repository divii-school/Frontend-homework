"use client";

import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import type { ApiError } from "@/types/api";
import { SHOWS_OWN_ERROR } from "@/utils/query-client";
import { queryKeys } from "@/utils/query-keys";

/**
 * Next free product code for the create form ("PRD-000123"). Never cached between visits
 * (gcTime 0) so a second product never reuses the first one's code.
 */
export function useGetGeneratedProductCode(enabled = true) {
  return useQuery<string, ApiError>({
    queryKey: queryKeys.products.generatedCode(),
    queryFn: ({ signal }) => ProductService.generateCode(signal),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnMount: "always",
    meta: SHOWS_OWN_ERROR, // step 1 shows this error under the product code field
  });
}
