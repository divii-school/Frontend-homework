import { apiClient } from "./CoreAPIService";
import { API_ENDPOINTS } from "./endpoints";
import type { ApiEnvelope, PaginatedResult } from "@/types/api";
import type {
  AddProductPayload,
  CategoryOption,
  EditProductPayload,
  Product,
  ProductDetails,
  ProductListQuery,
  ProductsByCategoryNameParams,
  ProductsByCategoryParams,
} from "./ProductService.types";

// Every product endpoint (talking-club-backend release/qa, src/modules/products/v1/product.controller.ts).
// Lists: server filter + paging, order always id DESC (no sort param on release/qa).
// Mutations return the envelope so screens can toast `getApiMessage(res.message)`.

type Envelope = ApiEnvelope<null>;

function toPage<T>(res: ApiEnvelope<T[]>, fallbackPage: number): PaginatedResult<T> {
  const items = res.data ?? [];
  return {
    items,
    totalRecords: res.totalRecords ?? items.length,
    totalPage: res.totalPage ?? 1,
    page: Number(res.page ?? fallbackPage),
  };
}

const ProductService = {
  /** List A — search by product name + category filters + product type. */
  async getProductsByCategory(params: ProductsByCategoryParams, signal?: AbortSignal): Promise<PaginatedResult<Product>> {
    const res = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.BY_CATEGORY,
      {
        page: params.page,
        limit: params.limit,
        search: params.search?.trim(),
        categoryId: params.categoryId,
        subCategoryId: params.subCategoryId,
        childCategoryId: params.childCategoryId,
        productType: params.productType,
      },
      { signal },
    );
    return toPage(res, params.page);
  },

  /** List B — search by category name (any level). */
  async getProductsByCategoryName(params: ProductsByCategoryNameParams, signal?: AbortSignal): Promise<PaginatedResult<Product>> {
    const res = await apiClient.get<Product[]>(
      API_ENDPOINTS.PRODUCTS.LIST,
      { page: params.page, limit: params.limit, type: "categoryName", search: params.search?.trim() },
      { signal },
    );
    return toPage(res, params.page);
  },

  /** Picks list A or B from `searchType` (what the list screen keeps in the URL). */
  getProductList(query: ProductListQuery, signal?: AbortSignal): Promise<PaginatedResult<Product>> {
    if (query.searchType === "categoryName") {
      return ProductService.getProductsByCategoryName({ page: query.page, limit: query.limit, search: query.search }, signal);
    }
    return ProductService.getProductsByCategory(query, signal);
  },

  async getDetails(id: number, signal?: AbortSignal): Promise<ProductDetails> {
    const res = await apiClient.get<ProductDetails>(API_ENDPOINTS.PRODUCTS.DETAILS(id), undefined, { signal });
    return { ...res.data, productOptions: res.data.productOptions ?? [], images: res.data.images ?? [] };
  },

  add(payload: AddProductPayload): Promise<Envelope> {
    return apiClient.post<null, AddProductPayload>(API_ENDPOINTS.PRODUCTS.ADD, payload);
  },

  edit(id: number, payload: EditProductPayload): Promise<Envelope> {
    return apiClient.put<null, EditProductPayload>(API_ENDPOINTS.PRODUCTS.EDIT(id), payload);
  },

  /** Bulk soft delete — DELETE /products/delete { ids }. */
  deleteMany(ids: number[]): Promise<Envelope> {
    return apiClient.delete<null, { ids: number[] }>(API_ENDPOINTS.PRODUCTS.DELETE, { ids });
  },

  /** Visibility (노출 상태) — PUT /products/update-status/:id/yes|no. */
  updateStatus(id: number, isVisible: boolean): Promise<Envelope> {
    return apiClient.put<null>(API_ENDPOINTS.PRODUCTS.UPDATE_STATUS(id, isVisible ? "yes" : "no"));
  },

  /** Next free product code, e.g. "PRD-000123". */
  async generateCode(signal?: AbortSignal): Promise<string> {
    const res = await apiClient.get<string>(API_ENDPOINTS.PRODUCTS.GENERATE_CODE, undefined, { signal });
    return res.data;
  },

  /** Resolves when the ERP code is free; rejects with ApiError messageKey `erpCodeAlreadyExists` when taken. */
  checkErpCode(erpCode: string): Promise<Envelope> {
    return apiClient.get<null>(API_ENDPOINTS.PRODUCTS.CHECK_ERP_CODE, { erpCode: erpCode.trim() });
  },

  // ---- Category pickers for the product form -------------------------------------------------------
  async getPickerCategories(signal?: AbortSignal): Promise<CategoryOption[]> {
    const res = await apiClient.get<CategoryOption[]>(API_ENDPOINTS.PRODUCTS.PICKER_CATEGORIES, undefined, { signal });
    return res.data ?? [];
  },

  async getPickerSubCategories(categoryId: number, signal?: AbortSignal): Promise<CategoryOption[]> {
    const res = await apiClient.get<CategoryOption[]>(API_ENDPOINTS.PRODUCTS.PICKER_SUBCATEGORIES(categoryId), undefined, { signal });
    return res.data ?? [];
  },

  async getPickerChildCategories(subCategoryId: number, signal?: AbortSignal): Promise<CategoryOption[]> {
    const res = await apiClient.get<CategoryOption[]>(API_ENDPOINTS.PRODUCTS.PICKER_CHILDCATEGORIES(subCategoryId), undefined, { signal });
    return res.data ?? [];
  },
};

export default ProductService;
