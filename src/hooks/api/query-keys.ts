import type { CategoryLevel } from '@/types/product-category';
import type { ProductListQuery } from '@/types/product';

/**
 * Every TanStack Query key in one place. A mutation invalidates by prefix
 * (e.g. queryKeys.categories.all) so every list that could show the change reloads.
 */
export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    topLevel: () => ['categories', 'top'] as const,
    children: (level: CategoryLevel, parentId: number) => ['categories', 'children', level, parentId] as const,
    search: (term: string) => ['categories', 'search', term] as const,
    creatable: () => ['categories', 'creatable'] as const,
  },
  products: {
    all: ['products'] as const,
    list: (query: ProductListQuery) => ['products', 'list', query] as const,
    details: (id: number) => ['products', 'details', id] as const,
    byChildCategory: (childCategoryId: number, page: number) => ['products', 'by-category', childCategoryId, page] as const,
    generatedCode: () => ['products', 'generated-code'] as const,
  },
};
