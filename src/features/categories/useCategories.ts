import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from './categoryService';
import type { CategoryLevel } from './types';

export const categoryKeys = {
  all: ['product-category'] as const,
  list: (search: string) => ['product-category', 'list', search] as const,
};

export function useCategoryTree(search: string) {
  return useQuery({ queryKey: categoryKeys.list(search), queryFn: () => categoryService.list(search || undefined) });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { mode: 'create' | 'edit'; level: CategoryLevel; id?: number; name: string; parentId?: number }) =>
      v.mode === 'create'
        ? categoryService.create(v.level, v.name, v.parentId)
        : categoryService.update(v.level, v.id as number, v.name, v.parentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { level: CategoryLevel; id: number }) => categoryService.remove(v.level, v.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.all }),
  });
}
