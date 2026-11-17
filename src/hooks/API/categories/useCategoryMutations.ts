"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import ProductCategoryService from "@/api-services/ProductCategoryService";
import type {
  Category,
  CategoryLevel,
  CategoryTree,
  DeleteCategoryInput,
  ReorderCategoriesInput,
  SaveCategoryInput,
} from "@/api-services/ProductCategoryService.types";
import type { ApiEnvelope, ApiError } from "@/types/api";
import { SHOWS_OWN_ERROR } from "@/utils/query-client";
import { queryKeys } from "@/utils/query-keys";

// Category writes. Each mutation returns the API envelope; show `getApiMessage(res.message)` in a toast.
// Errors are ApiError: `categoryAlreadyExists` / `subCategoryAlreadyExists` / `childSubcategoryAlreadyExists`
// (show under the name field), `maximumCategoryLimitReached`, `*NotFound` (kind 'not-found').
// `meta: SHOWS_OWN_ERROR`: the category screens show these errors themselves (under the name field or in
// their own toast), so the default error toast of src/utils/query-client.ts stays away.

/** Everything that shows category data: the tree, the product-form pickers, product rows. */
function invalidateCategoryData(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.pickers() }),
    queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
  ]);
}

/** Add (no id) or edit (id) a category at any level. */
export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation<ApiEnvelope<null>, ApiError, SaveCategoryInput>({
    mutationFn: (input) => ProductCategoryService.save(input),
    meta: SHOWS_OWN_ERROR,
    onSuccess: () => invalidateCategoryData(queryClient),
  });
}

/** Delete one node. The screen must block deleting a node that still has children (TL rule B). */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation<ApiEnvelope<null>, ApiError, DeleteCategoryInput>({
    mutationFn: (input) => ProductCategoryService.remove(input),
    meta: SHOWS_OWN_ERROR,
    onSuccess: () => invalidateCategoryData(queryClient),
  });
}

/** Puts siblings at one level into the order of `ids`. */
function reorderTree(tree: CategoryTree, level: CategoryLevel, ids: number[]): CategoryTree {
  const position = new Map(ids.map((id, index) => [id, index]));
  const sortSiblings = <T extends { id: number }>(items: T[]): T[] => {
    if (!items.some((item) => position.has(item.id))) return items;
    return [...items].sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0));
  };
  const categories: Category[] =
    level === "category"
      ? sortSiblings(tree.categories)
      : tree.categories.map((category) => ({
          ...category,
          subCategories:
            level === "subCategory"
              ? sortSiblings(category.subCategories)
              : category.subCategories.map((sub) => ({ ...sub, childCategories: sortSiblings(sub.childCategories) })),
        }));
  return { ...tree, categories };
}

/**
 * Saves a drag-and-drop order. Optimistic: the cached tree is reordered immediately and rolled back
 * if the API refuses, then refetched either way.
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiEnvelope<null>,
    ApiError,
    ReorderCategoriesInput,
    { previous: Array<[readonly unknown[], CategoryTree | undefined]> }
  >({
    mutationFn: (input) => ProductCategoryService.reorderLevel(input),
    meta: SHOWS_OWN_ERROR,
    onMutate: async ({ level, ids }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories.all });
      const previous = queryClient.getQueriesData<CategoryTree>({ queryKey: queryKeys.categories.all });
      queryClient.setQueriesData<CategoryTree>({ queryKey: queryKeys.categories.all }, (tree) =>
        tree ? reorderTree(tree, level, ids) : tree,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => invalidateCategoryData(queryClient),
  });
}
