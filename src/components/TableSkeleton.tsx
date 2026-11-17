import { Skeleton } from "primereact/skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  label?: string;
}

// Loading placeholder shaped like the table it replaces. role="status" + hidden text for screen readers.
export default function TableSkeleton({ rows = 6, columns = 6, label = "불러오는 중…" }: TableSkeletonProps) {
  return (
    <div className="table-skeleton" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div className="table-skeleton-row" key={rowIndex} aria-hidden="true">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <Skeleton className="table-skeleton-cell" key={colIndex} />
          ))}
        </div>
      ))}
    </div>
  );
}
