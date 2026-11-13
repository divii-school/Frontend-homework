import { httpClient } from '@/lib/api/http-client';
import type { ApiResponse } from '@/types/api';
import type {
  CategoryLevel,
  CategoryNode,
  CategorySaveRequest,
  ProductCategory,
  ProductCategoryListExtras,
} from '@/types/product-category';

/** Endpoint paths per tree level: add / edit/{id} / delete/{id}. */
const LEVEL_PATH: Record<CategoryLevel, string> = {
  category: '/product-category',
  subCategory: '/product-category/subcategory',
  childCategory: '/product-category/subcategory-child',
};

/** Reorder endpoint per level (body { ids: string[] } in the new order). */
const REORDER_PATH: Record<CategoryLevel, string> = {
  category: '/product-category/reorder-categories',
  subCategory: '/product-category/reorder-subcategories',
  childCategory: '/product-category/reorder-subsubcategories',
};

export type CategorySearchResult = { items: ProductCategory[] } & ProductCategoryListExtras;

const bySortOrder = (a: CategoryNode, b: CategoryNode) => a.sortOrder - b.sortOrder || a.id - b.id;

/**
 * Product Category Management API.
 *
 * The tree is read level by level (GET /products/categories → /subcategories/{id} → /childcategories/{id})
 * because GET /product-category/list without a search term returns only 3 of the 12 top-level
 * categories on the QA server (checked 2026-11-13). The list endpoint is still used for search.
 */
export const ProductCategoryService = {
  /** All top-level categories (대분류), in display order. */
  async topLevel(): Promise<CategoryNode[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryNode[]>>('/products/categories');
    return [...data.data].sort(bySortOrder);
  },

  /** 중분류 under a 대분류. */
  async subCategories(categoryId: number): Promise<CategoryNode[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryNode[]>>(`/products/subcategories/${categoryId}`);
    return [...data.data].sort(bySortOrder);
  },

  /** 소분류 under a 중분류. */
  async childCategories(subCategoryId: number): Promise<CategoryNode[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryNode[]>>(`/products/childcategories/${subCategoryId}`);
    return [...data.data].sort(bySortOrder);
  },

  /** Server-side search: GET /product-category/list?search= → matching branches of the tree. */
  async search(term: string): Promise<CategorySearchResult> {
    const { data } = await httpClient.get<ApiResponse<ProductCategory[]> & ProductCategoryListExtras>(
      '/product-category/list',
      { params: { search: term } },
    );
    return { items: data.data, totalRecords: data.totalRecords, isCreatable: data.isCreatable };
  },

  /** Whether a new 대분류 may be added (the API caps top-level categories; see isCreatable). */
  async canCreateTopLevel(): Promise<boolean> {
    const { data } = await httpClient.get<ApiResponse<ProductCategory[]> & ProductCategoryListExtras>(
      '/product-category/list',
    );
    return data.isCreatable;
  },

  async save(request: CategorySaveRequest, id?: number): Promise<void> {
    const { level, ...body } = request;
    const base = LEVEL_PATH[level];
    if (id === undefined) await httpClient.post(`${base}/add`, body);
    else await httpClient.put(`${base}/edit/${id}`, body);
  },

  async remove(level: CategoryLevel, id: number): Promise<void> {
    await httpClient.delete(`${LEVEL_PATH[level]}/delete/${id}`);
  },

  /** Saves a new order for siblings of one parent. */
  async reorder(level: CategoryLevel, orderedIds: number[]): Promise<void> {
    await httpClient.put(REORDER_PATH[level], { ids: orderedIds.map(String) });
  },
};
