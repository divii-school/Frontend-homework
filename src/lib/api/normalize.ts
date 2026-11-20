/**
 * The Swagger spec does not document response bodies, so these helpers read the
 * common Talking Club envelope ({ statusCode, message, data }) defensively.
 * If the real shape differs, fix it here once instead of in every screen.
 */
export type Json = Record<string, unknown>;

export function isObject(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Returns body.data when present (one level, or two for { data: { data } } lists). */
export function unwrapData(body: unknown): unknown {
  if (isObject(body) && 'data' in body) return body.data;
  return body;
}

export function pickString(obj: unknown, keys: string[]): string | undefined {
  if (!isObject(obj)) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v !== '') return v;
    if (typeof v === 'number') return String(v);
  }
  return undefined;
}

export function pickNumber(obj: unknown, keys: string[]): number | undefined {
  if (!isObject(obj)) return undefined;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  }
  return undefined;
}

export function pickArray(obj: unknown, keys: string[]): unknown[] {
  if (Array.isArray(obj)) return obj;
  if (!isObject(obj)) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return [];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

/** Accepts { data: [...], totalRecords } / { data: { data: [...], total } } / plain array. */
export function toPaged<T>(body: unknown, mapItem: (raw: unknown) => T, page: number, limit: number): Paged<T> {
  let inner = unwrapData(body);
  if (isObject(inner) && isObject(inner.data)) inner = inner.data;
  const list = pickArray(inner, ['data', 'items', 'list', 'rows', 'result', 'records']);
  const total =
    pickNumber(inner, ['totalRecords', 'total', 'totalCount', 'count', 'totalItems']) ??
    pickNumber(body, ['totalRecords', 'total', 'totalCount', 'count']) ??
    list.length;
  const totalPages =
    pickNumber(inner, ['totalPage', 'totalPages', 'lastPage']) ?? Math.max(1, Math.ceil(total / Math.max(1, limit)));
  return { items: list.map(mapItem), total, page, totalPages };
}
