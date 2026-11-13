import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProductService, type ProductPage } from '@/services/product-service';
import { queryKeys } from '@/hooks/api/query-keys';
import type { ProductListQuery, ProductSaveRequest } from '@/types/product';

/** One page of the product list. Keeps the previous page on screen while the next one loads. */
export function useProductList(query: ProductListQuery) {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => ProductService.list(query),
    placeholderData: keepPreviousData,
  });
}

export function useProductDetails(id: number) {
  return useQuery({
    queryKey: queryKeys.products.details(id),
    queryFn: () => ProductService.details(id),
    enabled: Number.isInteger(id) && id > 0,
  });
}

/** Next free product code for the create form (never cached: two tabs must not share one). */
export function useGeneratedProductCode(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.products.generatedCode(),
    queryFn: () => ProductService.generateCode(),
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

/**
 * 노출 Yes/No from the list row (PUT /products/update-status/{id}/{yes|no}).
 * The row changes at once (optimistic) and goes back if the API refuses.
 */
export function useUpdateProductVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, visible }: { id: number; visible: boolean }) =>
      ProductService.updateStatus(id, visible ? 'yes' : 'no'),
    onMutate: async ({ id, visible }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products.all });
      const snapshots = queryClient.getQueriesData<ProductPage>({ queryKey: ['products', 'list'] });
      for (const [key, page] of snapshots) {
        if (!page) continue;
        queryClient.setQueryData<ProductPage>(key, {
          ...page,
          items: page.items.map((p) => (p.id === id ? { ...p, isVisible: visible } : p)),
        });
      }
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      for (const [key, page] of context?.snapshots ?? []) queryClient.setQueryData(key, page);
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.details(id) });
    },
  });
}

/** Deletes one or many products (the API takes a list). */
export function useDeleteProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => ProductService.remove(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductSaveRequest) => ProductService.create(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUpdateProduct(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductSaveRequest) => ProductService.update(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  });
}

export function useUploadProductImage() {
  return useMutation({ mutationFn: (file: File) => ProductService.uploadImage(file) });
}
