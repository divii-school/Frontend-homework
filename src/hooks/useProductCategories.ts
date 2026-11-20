import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productCategoryService, type CategoryInput } from "@/services/productCategories";
import type { CategoryLevel } from "@/types/category";

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

/** Create / edit / delete. Every success reloads all category lists (any search). */
export function useCategoryMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: productCategoryKeys.all });

  return {
    create: useMutation({ mutationFn: (input: CategoryInput) => productCategoryService.create(input), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: CategoryInput }) => productCategoryService.update(id, input),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: ({ id, level }: { id: number; level: CategoryLevel }) => productCategoryService.remove(id, level),
      onSuccess,
    }),
  };
}
