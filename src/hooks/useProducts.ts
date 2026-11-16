import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/products";
import type { PagedResult } from "@/services/http";
import type { ProductListItem, ProductListParams } from "@/types/product";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductListParams) => [...productKeys.lists(), params] as const,
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: ({ signal }) => productService.list(params, signal),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
  });
}

export function useDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => productService.remove(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

/** Inline Yes/No change: the row updates at once and rolls back if the API fails. */
export function useSetProductVisible(params: ProductListParams) {
  const queryClient = useQueryClient();
  const key = productKeys.list(params);
  return useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) => productService.setVisible(id, visible),
    onMutate: async ({ id, visible }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<PagedResult<ProductListItem>>(key);
      if (previous) {
        queryClient.setQueryData<PagedResult<ProductListItem>>(key, {
          ...previous,
          rows: previous.rows.map((row) => (row.id === id ? { ...row, isVisible: visible } : row)),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}
