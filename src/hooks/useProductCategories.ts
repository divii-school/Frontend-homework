import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { productCategoryService } from "@/services/productCategories";

export const productCategoryKeys = {
  all: ["product-categories"] as const,
  list: (search: string) => [...productCategoryKeys.all, "list", search.trim()] as const,
};

export function useProductCategories(search: string) {
  return useQuery({
    queryKey: productCategoryKeys.list(search),
    queryFn: ({ signal }) => productCategoryService.list(search, signal),
    // Keep the old tree on screen while a new search loads.
    placeholderData: keepPreviousData,
  });
}
