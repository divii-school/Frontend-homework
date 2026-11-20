"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ProductListParams } from "@/types/product";
import { parseProductParams, toProductQuery } from "@/utils/product-params";

/**
 * The product list state lives in the URL, not in useState:
 * - `params` is read from the query string on every render, so refresh, back/forward and a shared link all work;
 * - `update` writes a new query string. Changing a filter goes back to page 1 unless the page itself is what changed.
 */
export function useProductListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useMemo(() => parseProductParams(searchParams), [searchParams]);

  const update = useCallback(
    (changes: Partial<ProductListParams>, mode: "push" | "replace" = "push") => {
      const next: ProductListParams = { ...params, ...changes, page: changes.page ?? 1 };
      const query = toProductQuery(next);
      const url = query ? `${pathname}?${query}` : pathname;
      // push = a click the Back button should undo; replace = typing in the search box
      if (mode === "push") router.push(url, { scroll: false });
      else router.replace(url, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, update };
}
