import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productFormService } from "@/services/productForm";
import { productKeys } from "@/hooks/useProducts";
import type { ProductFormValues } from "@/types/productForm";

export const productFormKeys = {
  detail: (id: number) => [...productKeys.all, "detail", id] as const,
  code: () => [...productKeys.all, "new-code"] as const,
  majors: () => ["product-category-options", "major"] as const,
  subs: (id: number) => ["product-category-options", "sub", id] as const,
  children: (id: number) => ["product-category-options", "child", id] as const,
};

export function useProductDetail(id: number | null) {
  return useQuery({
    queryKey: productFormKeys.detail(id ?? 0),
    queryFn: ({ signal }) => productFormService.detail(id as number, signal),
    enabled: id !== null,
  });
}

/** A fresh product code for the create screen (never reused from cache). */
export function useGeneratedCode(enabled: boolean) {
  return useQuery({
    queryKey: productFormKeys.code(),
    queryFn: () => productFormService.generateCode(),
    enabled,
    staleTime: Infinity,
    gcTime: 0,
  });
}

export function useMajorCategories() {
  return useQuery({ queryKey: productFormKeys.majors(), queryFn: () => productFormService.majorCategories(), staleTime: 5 * 60_000 });
}

export function useSubCategories(categoryId: number | null) {
  return useQuery({
    queryKey: productFormKeys.subs(categoryId ?? 0),
    queryFn: () => productFormService.subCategories(categoryId as number),
    enabled: categoryId !== null,
    staleTime: 5 * 60_000,
  });
}

export function useChildCategories(subCategoryId: number | null) {
  return useQuery({
    queryKey: productFormKeys.children(subCategoryId ?? 0),
    queryFn: () => productFormService.childCategories(subCategoryId as number),
    enabled: subCategoryId !== null,
    staleTime: 5 * 60_000,
  });
}

export function useSaveProduct(id: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ProductFormValues) => (id === null ? productFormService.create(values) : productFormService.update(id, values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}
