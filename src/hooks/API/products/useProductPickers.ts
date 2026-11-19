"use client";

import { useQuery } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import type { CategoryOption } from "@/api-services/ProductService.types";
import type { ApiError } from "@/types/api";
import { SHOWS_OWN_ERROR } from "@/utils/query-client";
import { queryKeys } from "@/utils/query-keys";

// Cascading category dropdowns for the product form and the list filters:
// top → middle (needs categoryId) → minor (needs subCategoryId).
// `meta: SHOWS_OWN_ERROR`: the dropdowns show a failed load themselves (hint under the field / in the filter).

const PICKER_STALE_MS = 5 * 60_000;

export function useGetPickerCategories() {
  return useQuery<CategoryOption[], ApiError>({
    queryKey: queryKeys.products.pickerCategories(),
    queryFn: ({ signal }) => ProductService.getPickerCategories(signal),
    staleTime: PICKER_STALE_MS,
    meta: SHOWS_OWN_ERROR,
  });
}

export function useGetPickerSubCategories(categoryId: number | null | undefined) {
  const id = typeof categoryId === "number" && categoryId > 0 ? categoryId : null;
  return useQuery<CategoryOption[], ApiError>({
    queryKey: queryKeys.products.pickerSubCategories(id),
    queryFn: ({ signal }) => ProductService.getPickerSubCategories(id as number, signal),
    enabled: id !== null,
    staleTime: PICKER_STALE_MS,
    meta: SHOWS_OWN_ERROR,
  });
}

export function useGetPickerChildCategories(subCategoryId: number | null | undefined) {
  const id = typeof subCategoryId === "number" && subCategoryId > 0 ? subCategoryId : null;
  return useQuery<CategoryOption[], ApiError>({
    queryKey: queryKeys.products.pickerChildCategories(id),
    queryFn: ({ signal }) => ProductService.getPickerChildCategories(id as number, signal),
    enabled: id !== null,
    staleTime: PICKER_STALE_MS,
    meta: SHOWS_OWN_ERROR,
  });
}
