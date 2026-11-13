import axios from 'axios';
import type { ApiErrorBody } from '@/types/api';

/** Kinds of failure the screens react to differently. */
export type ApiErrorKind =
  | 'network' // no response at all (offline, DNS, CORS, timeout)
  | 'unauthorized' // 401
  | 'forbidden' // 403
  | 'notFound' // 404, or the API's own "...NotFound" key
  | 'validation' // 400 with a list of field sentences
  | 'business' // 400/409/422 with one message key
  | 'server'; // 5xx

/** One normalised error, so components never read axios internals. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  /** Raw API messages: one key ("invalidPassword") or several validation sentences. */
  readonly apiMessages: string[];

  constructor(kind: ApiErrorKind, status: number | null, apiMessages: string[]) {
    super(apiMessages[0] ?? kind);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.apiMessages = apiMessages;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'success' in value && 'message' in value;
}

function kindFor(status: number, messages: string[]): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404 || messages.some((m) => /notfound$/i.test(m))) return 'notFound';
  if (status >= 500) return 'server';
  if (messages.length > 1 || messages.some((m) => m.includes(' '))) return 'validation';
  return 'business';
}

/** Turns anything thrown by axios (or our code) into an ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    if (!error.response) return new ApiError('network', null, []);
    const { status, data } = error.response;
    const raw = isApiErrorBody(data) ? data.message : [];
    const messages = Array.isArray(raw) ? raw : [raw];
    return new ApiError(kindFor(status, messages), status, messages.filter(Boolean));
  }
  return new ApiError('network', null, []);
}
