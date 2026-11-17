"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import ProductService from "@/api-services/ProductService";
import type {
  AddProductPayload,
  EditProductInput,
  Product,
  UpdateProductStatusInput,
} from "@/api-services/ProductService.types";
import type { ApiEnvelope, ApiError, PaginatedResult } from "@/types/api";
import { queryKeys } from "@/utils/query-keys";

// Product writes. Each returns the API envelope (toast `getApiMessage(res.message)`; note the API
// answers `productCreatedSucessFully` for add AND edit). Errors are ApiError — e.g.
// `unitPriceMustBeLessThanPrice`, `productNotFound`, DTO validation with `fieldErrors`.

function invalidateProducts(queryClient: QueryClient, id?: number) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
    id
      ? queryClient.invalidateQueries({ queryKey: queryKeys.products.details(id) })
      : queryClient.invalidateQueries({ queryKey: queryKeys.products.detailsAll() }),
  ]);
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation<ApiEnvelope<null>, ApiError, AddProductPayload>({
    mutationFn: (payload) => ProductService.add(payload),
    onSuccess: () => invalidateProducts(queryClient),
  });
}

export function useEditProduct() {
  const queryClient = useQueryClient();
  return useMutation<ApiEnvelope<null>, ApiError, EditProductInput>({
    mutationFn: ({ id, payload }) => ProductService.edit(id, payload),
    onSuccess: (_res, { id }) => invalidateProducts(queryClient, id),
  });
}

/** Bulk delete (soft) — pass the selected ids (≤ 100, design 8.1.0 ⑤). */
export function useDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation<ApiEnvelope<null>, ApiError, number[]>({
    mutationFn: (ids) => ProductService.deleteMany(ids),
    onSuccess: async (_res, ids) => {
      ids.forEach((id) => queryClient.removeQueries({ queryKey: queryKeys.products.details(id) }));
      await invalidateProducts(queryClient);
    },
  });
}

/**
 * Inline visibility dropdown (design 8.1.0 ⑩). Optimistic: every cached list row flips at once and
 * rolls back if the API refuses; the screen shows the toast.
 */
export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation<
    ApiEnvelope<null>,
    ApiError,
    UpdateProductStatusInput,
    { previous: Array<[readonly unknown[], PaginatedResult<Product> | undefined]> }
  >({
    mutationFn: ({ id, isVisible }) => ProductService.updateStatus(id, isVisible),
    onMutate: async ({ id, isVisible }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.lists() });
      const previous = queryClient.getQueriesData<PaginatedResult<Product>>({ queryKey: queryKeys.products.lists() });
      queryClient.setQueriesData<PaginatedResult<Product>>({ queryKey: queryKeys.products.lists() }, (page) =>
        page ? { ...page, items: page.items.map((row) => (row.id === id ? { ...row, isVisible } : row)) } : page,
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: (_res, _error, { id }) => invalidateProducts(queryClient, id),
  });
}

/** On-demand ERP code check: resolves when free, rejects with messageKey `erpCodeAlreadyExists`. */
export function useCheckErpCode() {
  return useMutation<ApiEnvelope<null>, ApiError, string>({
    mutationFn: (erpCode) => ProductService.checkErpCode(erpCode),
  });
}
