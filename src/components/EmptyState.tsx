import type { ReactNode } from "react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  /** Optional call to action, e.g. "Clear search" or "Register a product". */
  action?: ReactNode;
  icon?: string;
}

// Shown when a list has no rows (first use, or the search matched nothing — design: "No search results found").
export default function EmptyState({
  title = "검색 결과가 없습니다",
  description = "다른 검색어를 입력하거나 필터를 초기화해 주세요.",
  action,
  icon = "pi pi-inbox",
}: EmptyStateProps) {
  return (
    <div className="state-box state-box-empty" role="status">
      <i className={`state-box-icon ${icon}`} aria-hidden="true" />
      <h2 className="state-box-title">{title}</h2>
      {description && <p className="state-box-description">{description}</p>}
      {action && <div className="state-box-action">{action}</div>}
    </div>
  );
}
