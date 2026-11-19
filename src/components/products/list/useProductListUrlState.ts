"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  DEFAULT_LIST_STATE,
  parseListParams,
  toSearchString,
  type ProductListUrlState,
} from "./list-url-state";
import { rememberListUrl } from "./product-routes";

/**
 * The list's state, read from and written to the URL.
 *   const { state, update, reset } = useProductListUrlState();
 *   update({ productType: 'MAIN' })   → ?productType=MAIN          (page goes back to 1)
 *   update({ page: 3 })               → ?page=3&productType=MAIN   (only a page change keeps the page)
 * Writes use router.replace, so filter clicks don't pile up in the browser history.
 */
export function useProductListUrlState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  // URL → state (re-parsed only when the query string changes)
  const state = useMemo(() => parseListParams(new URLSearchParams(currentSearch)), [currentSearch]);

  // state → URL
  const navigate = useCallback(
    (next: ProductListUrlState) => {
      const search = toSearchString(next);
      router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // Every change except an explicit page change starts again at page 1
  const update = useCallback(
    (patch: Partial<ProductListUrlState>) => navigate({ ...state, page: 1, ...patch }),
    [navigate, state],
  );

  const reset = useCallback(() => navigate(DEFAULT_LIST_STATE), [navigate]);

  // Invalid or messy params (?page=abc&limit=7) are rewritten once to their clean form,
  // and the clean URL is remembered for the details page's "Back to list"
  useEffect(() => {
    const canonical = toSearchString(state);
    if (canonical !== currentSearch) {
      navigate(state);
      return;
    }
    rememberListUrl(canonical ? `${pathname}?${canonical}` : pathname);
  }, [state, currentSearch, navigate, pathname]);

  return { state, update, reset };
}
