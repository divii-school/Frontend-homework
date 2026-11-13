'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseListParams, toQueryString, type ProductListParams } from '@/lib/product-list-params';

/**
 * The product list's state lives in the URL, not in React state, so refresh, back/forward,
 * a shared link and returning from a detail page all show the same page/search.
 * Changing the search or page size goes back to page 1.
 */
export function useProductListParams() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const params = useMemo(() => parseListParams(search), [search]);

  const setParams = useCallback(
    (patch: Partial<ProductListParams>) => {
      const resetsPage = 'q' in patch || 'type' in patch || 'size' in patch;
      const next = { ...params, ...patch, page: resetsPage ? 1 : (patch.page ?? params.page) };
      router.push(`${pathname}${toQueryString(next)}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, setParams, queryString: toQueryString(params) };
}
