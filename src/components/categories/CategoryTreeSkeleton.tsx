import { Skeleton } from "primereact/skeleton";

/** Depth of each placeholder row: looks like a main category with its sub / minor rows. */
const ROWS: Array<1 | 2 | 3> = [1, 2, 3, 3, 2, 1, 2, 2];
/** Deeper rows get shorter bars, like real names under a parent. */
const BAR_WIDTH: Record<1 | 2 | 3, string> = { 1: "36%", 2: "28%", 3: "22%" };

// Loading placeholder shaped like the tree. role="status" + hidden text for screen readers.
export default function CategoryTreeSkeleton() {
  return (
    <div className="category-tree-skeleton" role="status" aria-busy="true">
      <span className="sr-only">Loading categories…</span>
      {ROWS.map((depth, index) => (
        <div key={index} className={`category-skeleton-row category-row-depth-${depth}`} aria-hidden="true">
          <Skeleton width={BAR_WIDTH[depth]} />
        </div>
      ))}
    </div>
  );
}
