import axios from 'axios';
import { httpClient } from '@/lib/api/http-client';
import { toApiError } from '@/lib/api/api-error';
import { getAccessToken } from '@/lib/auth/session-storage';
import type { ApiPagedResponse, ApiResponse } from '@/types/api';
import type {
  ProductDetails,
  ProductListItem,
  ProductListQuery,
  ProductSaveRequest,
  UploadedImage,
} from '@/types/product';

export interface ProductPage {
  items: ProductListItem[];
  totalRecords: number;
  totalPage: number;
  page: number;
}

/** Product Management API (tag "Product Management" in Swagger). */
export const ProductService = {
  /** GET /products?page&limit&type&search → one page. */
  async list(query: ProductListQuery): Promise<ProductPage> {
    const params: Record<string, string | number> = { page: query.page, limit: query.limit };
    if (query.search) {
      params.search = query.search;
      if (query.type) params.type = query.type;
    }
    const { data } = await httpClient.get<ApiPagedResponse<ProductListItem>>('/products', { params });
    return { items: data.data, totalRecords: data.totalRecords, totalPage: data.totalPage, page: data.page };
  },

  /** GET /products/get-products-by-category → products in one 소분류 (details page tab). */
  async byChildCategory(childCategoryId: number, page: number, limit: number): Promise<ProductPage> {
    const { data } = await httpClient.get<ApiPagedResponse<ProductListItem>>('/products/get-products-by-category', {
      params: { childCategoryId, page, limit },
    });
    return { items: data.data, totalRecords: data.totalRecords, totalPage: data.totalPage, page: data.page };
  },

  async details(id: number): Promise<ProductDetails> {
    const { data } = await httpClient.get<ApiResponse<ProductDetails>>(`/products/details/${id}`);
    return data.data;
  },

  /** GET /products/generate-code → next free code, e.g. "PRD-020001". */
  async generateCode(): Promise<string> {
    const { data } = await httpClient.get<ApiResponse<string>>('/products/generate-code');
    return data.data;
  },

  async create(body: ProductSaveRequest): Promise<void> {
    await httpClient.post('/products/add', body);
  },

  async update(id: number, body: ProductSaveRequest): Promise<void> {
    const { productCode: _immutable, ...editable } = body;
    void _immutable;
    await httpClient.put(`/products/edit/${id}`, editable);
  },

  /**
   * DELETE /products/delete with { ids: number[] } — single and bulk delete.
   * The OpenAPI doc says string items, but the server refuses strings ("each value in ids must be a number").
   */
  async remove(ids: number[]): Promise<void> {
    await httpClient.delete('/products/delete', { data: { ids } });
  },

  /** PUT /products/update-status/{id}/{status}. */
  async updateStatus(id: number, status: string): Promise<void> {
    await httpClient.put(`/products/update-status/${id}/${status}`);
  },

  /** Uploads one image through our /api/upload route (see that file for why). */
  async uploadImage(file: File): Promise<UploadedImage> {
    const form = new FormData();
    form.append('file', file);
    const token = getAccessToken();
    try {
      const { data } = await axios.post<ApiResponse<UploadedImage>>('/api/upload', form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
