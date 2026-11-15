"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * One value kept in the URL (?tab=category, ?step=2, ?search=…). `allowed` lists the valid values; anything
 * else reads as the first one, so a hand-typed URL cannot put the screen in a state that does not exist.
 */
export function useUrlParam<T extends string>(name: string, allowed: readonly T[]): [T, (value: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get(name) as T | null;
  const value = raw && allowed.includes(raw) ? raw : allowed[0];

  const setValue = useCallback(
    (next: T) => {
      const query = new URLSearchParams(searchParams);
      if (next === allowed[0]) query.delete(name);
      else query.set(name, next);
      const text = query.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [allowed, name, pathname, router, searchParams],
  );

  return [value, setValue];
}
