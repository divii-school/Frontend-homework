import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService, type ProductListParams } from './productService';
import type { ProductFormValues, YesNo } from './types';

export const productKeys = {
  all: ['products'] as const,
  list: (p: ProductListParams) => ['products', 'list', p] as const,
  detail: (id: number) => ['products', 'detail', id] as const,
  related: (categoryId: number, page: number) => ['products', 'by-category', categoryId, page] as const,
  categories: ['products', 'categories'] as const,
  sub: (id: number) => ['products', 'subcategories', id] as const,
  child: (id: number) => ['products', 'childcategories', id] as const,
};

export function useProductList(p: ProductListParams) {
  return useQuery({
    queryKey: productKeys.list(p),
    queryFn: ({ signal }) => productService.list(p, signal),
    placeholderData: keepPreviousData,
  });
}

export function useProductDetail(id: number, enabled = true) {
  return useQuery({ queryKey: productKeys.detail(id), queryFn: () => productService.detail(id), enabled: enabled && id > 0 });
}

export function useRelatedProducts(categoryId: number | undefined, page: number, enabled: boolean) {
  return useQuery({
    queryKey: productKeys.related(categoryId ?? 0, page),
    queryFn: () => productService.byCategory(categoryId as number, page, 10),
    enabled: enabled && !!categoryId,
  });
}

export function useProductCategories() {
  return useQuery({ queryKey: productKeys.categories, queryFn: productService.categories, staleTime: 5 * 60_000 });
}
export function useSubcategories(id: number | null) {
  return useQuery({ queryKey: productKeys.sub(id ?? 0), queryFn: () => productService.subcategories(id as number), enabled: !!id });
}
export function useChildcategories(id: number | null) {
  return useQuery({ queryKey: productKeys.child(id ?? 0), queryFn: () => productService.childcategories(id as number), enabled: !!id });
}

export function useSaveProduct(id?: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: ProductFormValues) => (id ? productService.update(id, v) : productService.create(v)),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useDeleteProducts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => productService.removeMany(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { ids: number[]; status: YesNo }) =>
      Promise.all(v.ids.map((id) => productService.updateStatus(id, v.status))),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
  });
}
