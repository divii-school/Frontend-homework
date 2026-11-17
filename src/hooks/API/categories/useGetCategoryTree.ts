"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import ProductCategoryService from "@/api-services/ProductCategoryService";
import type { CategoryTree } from "@/api-services/ProductCategoryService.types";
import type { ApiError } from "@/types/api";
import { SHOWS_OWN_ERROR } from "@/utils/query-client";
import { queryKeys } from "@/utils/query-keys";

/**
 * The 3-level category tree for 8.2.0, filtered server-side by `search` (name at any level).
 * Keeps the previous tree on screen while a new search loads.
 */
export function useGetCategoryTree(search = "") {
  const term = search.trim();
  return useQuery<CategoryTree, ApiError>({
    queryKey: queryKeys.categories.tree(term),
    queryFn: ({ signal }) => ProductCategoryService.getTree(term, signal),
    placeholderData: keepPreviousData,
    meta: SHOWS_OWN_ERROR, // the category screen shows this error inline (StateWrapper)
  });
}
