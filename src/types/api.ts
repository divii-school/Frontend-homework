/**
 * Shapes shared by every Talking Club admin API response.
 * Taken from real QA-server responses, not from the Swagger text
 * (Swagger has no response schemas).
 */

/** Successful single-object or array response: `{ success, message, data }`. */
export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Paged list response, e.g. GET /products: `data` is the page, the rest is paging info. */
export interface ApiPagedResponse<T> extends ApiResponse<T[]> {
  totalRecords: number;
  totalPage: number;
  page: number;
}

/**
 * Error body. `message` is either one i18n key ("invalidPassword", "productNotFound")
 * or, for DTO validation, a list of English sentences ("name should not be empty").
 */
export interface ApiErrorBody {
  success: false;
  message: string | string[];
  data: null;
  errors: unknown;
  statusCode: number;
  timestamp: string;
  path: string;
}

/** Paging input used by our list screens (1-based, like the API). */
export interface PageQuery {
  page: number;
  limit: number;
}
