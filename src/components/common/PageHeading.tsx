import type { ReactNode } from "react";

interface PageHeadingProps {
  title: string;
  /** Path of the page in the menu, e.g. ["쇼핑몰 관리", "상품 관리"]. */
  breadcrumb?: string[];
  /** Buttons on the right (등록, 수정 …). */
  actions?: ReactNode;
}

/** Title row shared by every page: the h1, the breadcrumb and the page actions. */
export function PageHeading({ title, breadcrumb, actions }: PageHeadingProps) {
  return (
    <div className="page-heading">
      <div className="page-heading-text">
        <h1 className="page-heading-title">{title}</h1>
        {breadcrumb && (
          <nav className="page-heading-breadcrumb" aria-label="현재 위치">
            {breadcrumb.join(" / ")}
          </nav>
        )}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
  );
}
