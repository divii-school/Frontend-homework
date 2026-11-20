import { api } from '@/lib/api/client';
import { pickArray, pickNumber, pickString, unwrapData } from '@/lib/api/normalize';
import type { CategoryLevel, CategoryNode } from './types';

const CHILD_KEYS: Record<1 | 2, string[]> = {
  1: ['subCategories', 'subcategories', 'subCategory', 'children', 'sub_categories'],
  2: ['childCategories', 'childcategories', 'subSubCategories', 'children', 'child_categories'],
};

function mapNode(raw: unknown, level: CategoryLevel, parentId?: number): CategoryNode {
  const id = pickNumber(raw, ['id', 'categoryId', 'subCategoryId', 'childCategoryId']) ?? 0;
  const children =
    level < 3 ? pickArray(raw, CHILD_KEYS[level as 1 | 2]).map((c) => mapNode(c, (level + 1) as CategoryLevel, id)) : [];
  return {
    id,
    name: pickString(raw, ['name', 'categoryName', 'subCategoryName', 'childCategoryName', 'title']) ?? '-',
    level,
    parentId,
    children,
  };
}

export function mapCategoryTree(body: unknown): CategoryNode[] {
  let d = unwrapData(body);
  if (!Array.isArray(d)) d = pickArray(d, ['data', 'categories', 'list', 'items']);
  return (d as unknown[]).map((c) => mapNode(c, 1));
}

/** Endpoint path per level. */
const BASE: Record<CategoryLevel, string> = {
  1: '/product-category',
  2: '/product-category/subcategory',
  3: '/product-category/subcategory-child',
};

export const categoryService = {
  async list(search?: string): Promise<CategoryNode[]> {
    return mapCategoryTree(await api.get('/product-category/list', { search }));
  },
  create(level: CategoryLevel, name: string, parentId?: number) {
    const body =
      level === 1 ? { name } : level === 2 ? { name, categoryId: parentId } : { name, subCategoryId: parentId };
    return api.post(`${BASE[level]}/add`, body);
  },
  update(level: CategoryLevel, id: number, name: string, parentId?: number) {
    const body =
      level === 1 ? { name } : level === 2 ? { name, categoryId: parentId } : { name, subCategoryId: parentId };
    return api.put(`${BASE[level]}/edit/${id}`, body);
  },
  remove(level: CategoryLevel, id: number) {
    return api.delete(`${BASE[level]}/delete/${id}`);
  },
};
