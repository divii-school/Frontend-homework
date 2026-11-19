"use client";

import { useCallback, useState } from "react";
import { PRODUCT_RULES } from "@/utils/constants";

/**
 * Row selection for bulk actions (design 8.1.0 ⑤: up to 100 at once).
 * Kept as a Set of product ids in React state — not tied to the rows on screen — so moving to
 * another page or filter keeps what was already ticked. A refresh starts empty (by design: a
 * selection is a short-lived action, not a shareable view like the filters in the URL).
 */
export function useProductSelection(max: number = PRODUCT_RULES.maxSelection) {
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());

  /** Tick / untick one row. A new tick is ignored once `max` rows are selected. */
  const toggle = useCallback(
    (id: number) => {
      setSelected((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else if (next.size < max) next.add(id);
        return next;
      });
    },
    [max],
  );

  /**
   * Header checkbox: select every row of this page, or unselect them when all are already ticked.
   * Returns how many rows did not fit under the limit (the screen shows a warning).
   */
  const togglePage = useCallback(
    (ids: readonly number[]): number => {
      const next = new Set(selected);
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id));
      let skipped = 0;
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => {
          if (next.has(id)) return;
          if (next.size >= max) skipped += 1;
          else next.add(id);
        });
      }
      setSelected(next);
      return skipped;
    },
    [selected, max],
  );

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, count: selected.size, isFull: selected.size >= max, max, toggle, togglePage, clear };
}
