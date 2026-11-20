/** Every successful answer of the Talking Club admin API is wrapped like this. */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/** List endpoints add the paging numbers beside `data`. */
export interface PagedEnvelope<T> extends ApiEnvelope<T[]> {
  totalRecords: number;
  totalPage: number;
  page: number;
}

/** What the screens work with after a list call. */
export interface PagedResult<T> {
  items: T[];
  totalRecords: number;
  totalPages: number;
  page: number;
}

/**
 * Error body: `message` is a key ("invalidPassword"), a list of English validation sentences, or an object
 * that names the field ({ loginId: "invalidCredentials" }).
 */
export interface ApiErrorBody {
  success: false;
  message: string | string[] | Record<string, unknown>;
  statusCode: number;
}

export type ApiErrorKind = "network" | "unauthorized" | "forbidden" | "not-found" | "validation" | "server" | "unknown";

/** The one error type the app throws and shows. `messages` always has at least one readable line. */
export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly code: string | null;
  readonly messages: string[];

  constructor(init: { status: number; kind: ApiErrorKind; code: string | null; messages: string[] }) {
    super(init.messages[0]);
    this.name = "ApiError";
    this.status = init.status;
    this.kind = init.kind;
    this.code = init.code;
    this.messages = init.messages;
  }
}
