// Shapes shared by every Talking Club admin API call (talking-club-backend, branch release/qa).
// The NestJS SuccessResponseInterceptor wraps every answer in the same envelope, and the
// GlobalExceptionFilter turns every failure into the same error body.

/** Success envelope: `{ success, message, data, totalRecords?, totalPage?, page?, isCreatable? }`. */
export interface ApiEnvelope<T> {
  success: boolean;
  /** i18n-style key, e.g. `productDeletedSucessFully` — map it with getApiMessage(). */
  message: string;
  data: T;
  totalRecords?: number;
  totalPage?: number;
  page?: number;
  /** Category list only: false when 3 top-level categories exist (no more can be added). */
  isCreatable?: boolean;
}

/**
 * `message` on an error is
 *  - a key (`productNotFound`, `invalidPassword`) for business errors,
 *  - an array of class-validator sentences (`"name should not be empty"`) for DTO validation, or
 *  - an object `{ field: "message" }` when the custom validation pipe answers.
 */
export type ApiErrorMessage = string | string[] | Record<string, string>;

/** Error body from GlobalExceptionFilter. */
export interface ApiErrorBody {
  success?: false;
  message?: ApiErrorMessage;
  data?: unknown;
  errors?: unknown;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

/** What went wrong, so screens can pick the right state without reading status codes. */
export type ApiErrorKind = "unauthorized" | "forbidden" | "not-found" | "validation" | "server" | "network";

export interface ApiErrorInit {
  status: number;
  kind: ApiErrorKind;
  /** Raw key from the API (or a local key such as `networkError`). */
  messageKey: string;
  /** Readable English text for the UI. */
  message: string;
  /** Validation messages by field name, for forms (`setError(field, …)`). */
  fieldErrors?: Record<string, string>;
}

/** The only error type CoreAPIService throws. */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly messageKey: string;
  readonly fieldErrors?: Record<string, string>;

  constructor({ status, kind, messageKey, message, fieldErrors }: ApiErrorInit) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.messageKey = messageKey;
    this.fieldErrors = fieldErrors;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** A page of rows plus the paging numbers the list endpoints return. */
export interface PaginatedResult<T> {
  items: T[];
  totalRecords: number;
  totalPage: number;
  page: number;
}

/** "yes" / "no" flags the product endpoints take as strings. */
export type YesNo = "yes" | "no";
