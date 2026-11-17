// Layer 2: services (one per API area). Screens never import these directly — use src/hooks/API/*.
export { default as CoreAPIService, apiClient, toApiError, redirectToLogin, API_BASE_URL } from "./CoreAPIService";
export type { QueryParams, RequestOptions } from "./CoreAPIService";
export { API_ENDPOINTS } from "./endpoints";
export { default as AuthService } from "./AuthService";
export { default as ProductCategoryService } from "./ProductCategoryService";
export type * from "./ProductCategoryService.types";
export { default as ProductService } from "./ProductService";
export type * from "./ProductService.types";
export { default as UploadService, validateImageFile } from "./UploadService";
export type { UploadedFile } from "./UploadService";
