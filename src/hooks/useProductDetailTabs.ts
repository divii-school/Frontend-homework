import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productDetailService } from "@/services/productDetail";
import { productKeys } from "@/hooks/useProducts";

/**
 * One query per tab, each with its own key, so a tab loads (and fails) on its own.
 * `enabled` is false until the tab is opened → hidden tabs don't fetch.
 */
export function useProductSessions(productId: number, page: number, enabled: boolean) {
  return useQuery({
    queryKey: [...productKeys.all, "detail", productId, "sessions", page],
    queryFn: ({ signal }) => productDetailService.sessions(productId, page, signal),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useSameCategoryProducts(childCategoryId: number | null, page: number, enabled: boolean) {
  return useQuery({
    queryKey: [...productKeys.all, "detail", "same-category", childCategoryId, page],
    queryFn: ({ signal }) => productDetailService.sameCategory(childCategoryId as number, page, signal),
    enabled: enabled && childCategoryId !== null,
    placeholderData: keepPreviousData,
  });
}
