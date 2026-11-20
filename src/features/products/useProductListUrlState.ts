'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SearchType } from './types';

export type SortField = 'name' | 'price' | 'createdAt';
export interface ProductListState {
  page: number;
  limit: number;
  type: SearchType;
  search: string;
  sortField?: SortField;
  sortOrder: 1 | -1;
}

const LIMITS = [10, 20, 50];
const SORT_FIELDS: SortField[] = ['name', 'price', 'createdAt'];

/**
 * The URL is the single source of truth for the table:
 * ?page=2&limit=10&type=productName&search=abc&sort=price&order=desc
 * Refresh, back/forward and shared links all restore the same view.
 */
export function useProductListUrlState() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state: ProductListState = useMemo(() => {
    const page = Math.max(1, Number(params.get('page')) || 1);
    const limitRaw = Number(params.get('limit'));
    const sort = params.get('sort') as SortField | null;
    return {
      page,
      limit: LIMITS.includes(limitRaw) ? limitRaw : 10,
      type: params.get('type') === 'categoryName' ? 'categoryName' : 'productName',
      search: params.get('search') ?? '',
      sortField: sort && SORT_FIELDS.includes(sort) ? sort : undefined,
      sortOrder: params.get('order') === 'asc' ? 1 : -1,
    };
  }, [params]);

  const update = useCallback(
    (patch: Partial<ProductListState>) => {
      const next = { ...state, ...patch };
      const q = new URLSearchParams();
      if (next.page > 1) q.set('page', String(next.page));
      if (next.limit !== 10) q.set('limit', String(next.limit));
      if (next.search) {
        q.set('type', next.type);
        q.set('search', next.search);
      }
      if (next.sortField) {
        q.set('sort', next.sortField);
        q.set('order', next.sortOrder === 1 ? 'asc' : 'desc');
      }
      const qs = q.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [state, router, pathname],
  );

  return { state, update, limits: LIMITS };
}
