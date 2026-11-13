import { httpClient } from '@/lib/api/http-client';
import type { ApiResponse } from '@/types/api';
import type {
  CategoryLevel,
  CategoryOption,
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

export type ProductCategoryListResult = { items: ProductCategory[] } & ProductCategoryListExtras;

/** Product Category Management API (tag "Product Category Management" in Swagger). */
export const ProductCategoryService = {
  /** GET /product-category/list?search= → the whole tree, filtered by name on the server. */
  async list(search?: string): Promise<ProductCategoryListResult> {
    const { data } = await httpClient.get<ApiResponse<ProductCategory[]> & ProductCategoryListExtras>(
      '/product-category/list',
      { params: search ? { search } : {} },
    );
    return { items: data.data, totalRecords: data.totalRecords, isCreatable: data.isCreatable };
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

  /** Dropdown sources used by the product form (tag "Product Management"). */
  async categoryOptions(): Promise<CategoryOption[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryOption[]>>('/products/categories');
    return data.data.map(({ id, name }) => ({ id, name }));
  },
  async subCategoryOptions(categoryId: number): Promise<CategoryOption[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryOption[]>>(`/products/subcategories/${categoryId}`);
    return data.data.map(({ id, name }) => ({ id, name }));
  },
  async childCategoryOptions(subCategoryId: number): Promise<CategoryOption[]> {
    const { data } = await httpClient.get<ApiResponse<CategoryOption[]>>(`/products/childcategories/${subCategoryId}`);
    return data.data.map(({ id, name }) => ({ id, name }));
  },
};
