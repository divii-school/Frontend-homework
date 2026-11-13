import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductCategoryService } from '@/services/product-category-service';
import { queryKeys } from '@/hooks/api/query-keys';
import type { CategoryLevel, CategorySaveRequest } from '@/types/product-category';

/** 대분류 list. */
export function useTopCategories() {
  return useQuery({ queryKey: queryKeys.categories.topLevel(), queryFn: () => ProductCategoryService.topLevel() });
}

/**
 * Children of one node. `level` is the level of the CHILDREN ('subCategory' under a 대분류,
 * 'childCategory' under a 중분류). `enabled` lets a collapsed node skip the call.
 */
export function useChildCategories(level: CategoryLevel, parentId: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.categories.children(level, parentId),
    queryFn: () =>
      level === 'subCategory'
        ? ProductCategoryService.subCategories(parentId)
        : ProductCategoryService.childCategories(parentId),
    enabled,
  });
}

/** Server-side search (only runs when there is a term). */
export function useCategorySearch(term: string) {
  return useQuery({
    queryKey: queryKeys.categories.search(term),
    queryFn: () => ProductCategoryService.search(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  });
}

/** Whether 대분류 등록 is allowed right now (the API caps top-level categories). */
export function useCanCreateTopLevel() {
  return useQuery({ queryKey: queryKeys.categories.creatable(), queryFn: () => ProductCategoryService.canCreateTopLevel() });
}

/** Add or rename a node at any level. Reloads every category query afterwards. */
export function useSaveCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ request, id }: { request: CategorySaveRequest; id?: number }) => ProductCategoryService.save(request, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, id }: { level: CategoryLevel; id: number }) => ProductCategoryService.remove(level, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}

/**
 * Saves a new sibling order. The list is updated in the cache first (so the row moves at once)
 * and put back if the API refuses.
 */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, orderedIds }: { level: CategoryLevel; parentId: number; orderedIds: number[] }) =>
      ProductCategoryService.reorder(level, orderedIds),
    onMutate: async ({ level, parentId, orderedIds }) => {
      const key = queryKeys.categories.children(level, parentId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ id: number }[]>(key);
      if (previous) {
        const byId = new Map(previous.map((node) => [node.id, node]));
        queryClient.setQueryData(key, orderedIds.map((id) => byId.get(id)).filter(Boolean));
      }
      return { key, previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  });
}
