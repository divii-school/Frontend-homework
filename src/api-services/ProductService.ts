import type { ApiEnvelope, PagedEnvelope, PagedResult } from "@/types/api";
import type { CategoryOption } from "@/types/category";
import type { Product, ProductListParams, ProductRequest } from "@/types/product";
import { apiClient } from "@/utils/api-client";
import { API_ENDPOINTS } from "@/utils/api-integration";

const toPaged = <T>(body: PagedEnvelope<T>): PagedResult<T> => ({
  items: body.data,
  totalRecords: body.totalRecords,
  totalPages: body.totalPage,
  page: body.page,
});

/** One method per product endpoint. Components never call this directly; they use the hooks in hooks/API/products. */
export const ProductService = {
  /**
   * Search and paging happen on the server. With a category filter the "by category" endpoint is used,
   * because GET /products cannot filter by category id.
   */
  async list(params: Pick<ProductListParams, "page" | "limit" | "search" | "type" | "categoryId">): Promise<PagedResult<Product>> {
    const search = params.search || undefined;
    if (params.categoryId !== null) {
      const { data } = await apiClient.get<PagedEnvelope<Product>>(API_ENDPOINTS.products.byCategory, {
        params: { page: params.page, limit: params.limit, search, categoryId: params.categoryId },
      });
      return toPaged(data);
    }
    const { data } = await apiClient.get<PagedEnvelope<Product>>(API_ENDPOINTS.products.list, {
      params: { page: params.page, limit: params.limit, search, type: search ? params.type : undefined },
    });
    return toPaged(data);
  },

  async related(childCategoryId: number, limit: number): Promise<PagedResult<Product>> {
    const { data } = await apiClient.get<PagedEnvelope<Product>>(API_ENDPOINTS.products.byCategory, {
      params: { page: 1, limit, childCategoryId },
    });
    return toPaged(data);
  },

  async details(id: number): Promise<Product> {
    const { data } = await apiClient.get<ApiEnvelope<Product>>(API_ENDPOINTS.products.details(id));
    return data.data;
  },

  async create(request: ProductRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.products.add, request);
  },

  /** productCode cannot change after creation; the edit endpoint does not accept it. */
  async update(id: number, request: ProductRequest): Promise<void> {
    const { productCode: _unused, ...body } = request;
    void _unused;
    await apiClient.put(API_ENDPOINTS.products.edit(id), body);
  },

  async removeMany(ids: number[]): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.products.delete, { data: { ids } });
  },

  async setVisible(id: number, visible: boolean): Promise<void> {
    await apiClient.put(API_ENDPOINTS.products.status(id, visible));
  },

  async generateCode(): Promise<string> {
    const { data } = await apiClient.get<ApiEnvelope<string>>(API_ENDPOINTS.products.generateCode);
    return data.data;
  },

  async categories(): Promise<CategoryOption[]> {
    const { data } = await apiClient.get<ApiEnvelope<CategoryOption[]>>(API_ENDPOINTS.products.categories);
    return data.data;
  },

  async subCategories(categoryId: number): Promise<CategoryOption[]> {
    const { data } = await apiClient.get<ApiEnvelope<CategoryOption[]>>(API_ENDPOINTS.products.subCategories(categoryId));
    return data.data;
  },

  async childCategories(subCategoryId: number): Promise<CategoryOption[]> {
    const { data } = await apiClient.get<ApiEnvelope<CategoryOption[]>>(API_ENDPOINTS.products.childCategories(subCategoryId));
    return data.data;
  },
};
