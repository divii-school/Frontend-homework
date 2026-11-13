import { PRODUCT_SEARCH_TYPES, type ProductSearchType } from '@/types/product';

/** Page sizes the list offers; the design shows 10 per page. */
export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
/** Longest search term we send (the API has no limit; this keeps URLs sane). */
export const SEARCH_MAX = 50;

export interface ProductListParams {
  page: number;
  size: number;
  type: ProductSearchType;
  q: string;
}

export const DEFAULT_LIST_PARAMS: ProductListParams = { page: 1, size: DEFAULT_PAGE_SIZE, type: 'productName', q: '' };

type Readable = { get(name: string): string | null };

/**
 * URL → list state. Anything invalid falls back to the default, so a hand-edited or old URL
 * (?page=-3&size=999&type=x) still opens a working list instead of an error.
 */
export function parseListParams(search: Readable): ProductListParams {
  const page = Number(search.get('page'));
  const size = Number(search.get('size'));
  const type = search.get('type');
  const q = (search.get('q') ?? '').trim().slice(0, SEARCH_MAX);
  return {
    page: Number.isInteger(page) && page >= 1 ? page : DEFAULT_LIST_PARAMS.page,
    size: (PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_LIST_PARAMS.size,
    type: (PRODUCT_SEARCH_TYPES as readonly string[]).includes(type ?? '') ? (type as ProductSearchType) : 'productName',
    q,
  };
}

/** List state → query string. Defaults are left out so the URL stays short. */
export function toQueryString(params: ProductListParams): string {
  const out = new URLSearchParams();
  if (params.q) out.set('q', params.q);
  if (params.q && params.type !== DEFAULT_LIST_PARAMS.type) out.set('type', params.type);
  if (params.size !== DEFAULT_LIST_PARAMS.size) out.set('size', String(params.size));
  if (params.page !== DEFAULT_LIST_PARAMS.page) out.set('page', String(params.page));
  const text = out.toString();
  return text ? `?${text}` : '';
}
