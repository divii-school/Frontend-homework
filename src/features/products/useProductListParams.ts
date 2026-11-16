"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductListParams, ProductSearchType } from "@/types/product";

/**
 * The table state lives in the URL (?page=2&type=categoryName&search=ACE), so refresh,
 * back/forward and shared links all keep it. Defaults are left out of the URL.
 */
export function useProductListParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo<ProductListParams>(() => {
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10);
    const type: ProductSearchType = searchParams.get("type") === "categoryName" ? "categoryName" : "productName";
    return { page: Number.isFinite(page) && page > 0 ? page : 1, type, search: searchParams.get("search") ?? "" };
  }, [searchParams]);

  const update = useCallback(
    (next: Partial<ProductListParams>) => {
      const merged = { ...params, ...next };
      const query = new URLSearchParams();
      if (merged.search.trim()) {
        query.set("search", merged.search.trim());
        if (merged.type !== "productName") query.set("type", merged.type);
      }
      if (merged.page > 1) query.set("page", String(merged.page));
      const qs = query.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { params, update };
}
