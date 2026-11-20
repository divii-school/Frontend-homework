import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CategoryService } from "@/api-services/CategoryService";
import { ProductService } from "@/api-services/ProductService";
import type { ApiError } from "@/types/api";
import type { CategoryLevel, CategoryOption, CategoryTreeResult } from "@/types/category";
import { QUERIES } from "@/utils/api-integration";

/** The category tree, searched by the server. */
export function useGetCategoryTree(search: string) {
  return useQuery<CategoryTreeResult, ApiError>({
    queryKey: QUERIES.categories.tree(search),
    queryFn: () => CategoryService.tree(search),
  });
}

/**
 * Options for one of the three cascading selects. A lower level loads only after its parent is chosen
 * (`enabled`), and reloads by itself when the parent changes because the parent id is part of the key.
 */
export function useCategoryOptions(level: CategoryLevel, parentId: number | null) {
  return useQuery<CategoryOption[], ApiError>({
    queryKey: QUERIES.categories.options(level, parentId),
    queryFn: () => {
      if (level === "category") return ProductService.categories();
      if (level === "sub") return ProductService.subCategories(parentId as number);
      return ProductService.childCategories(parentId as number);
    },
    enabled: level === "category" || parentId !== null,
  });
}

interface SaveCategoryInput {
  level: CategoryLevel;
  name: string;
  /** Present when editing. */
  id?: number;
  parentId?: number;
}

/** Create or rename a category on any level; the tree and the form selects refresh afterwards. */
export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, SaveCategoryInput>({
    mutationFn: ({ level, name, id, parentId }) =>
      id === undefined ? CategoryService.create(level, name, parentId) : CategoryService.update(level, id, name, parentId),
    // Product rows and details show category names, so they are refreshed too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERIES.categories.all }),
        queryClient.invalidateQueries({ queryKey: QUERIES.products.all }),
      ]),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, { level: CategoryLevel; id: number }>({
    mutationFn: ({ level, id }) => CategoryService.remove(level, id),
    // Product rows and details show category names, so they are refreshed too.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERIES.categories.all }),
        queryClient.invalidateQueries({ queryKey: QUERIES.products.all }),
      ]),
  });
}
