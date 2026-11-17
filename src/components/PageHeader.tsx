import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  /** e.g. getBreadcrumb(ROUTE_KEYS.PRODUCTS) from @/config/navigation. Last item = current page. */
  breadcrumb?: BreadcrumbItem[];
  /** Buttons on the right (design: "Register"); full width on phones. */
  actions?: ReactNode;
}

// Page title block at the top of every screen (design 8.1.0 ①): title, breadcrumb, actions.
export default function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header-text">
        <h1 className="page-header-title">{title}</h1>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="page-header-breadcrumb" aria-label="현재 위치">
            <ol>
              {breadcrumb.map((item, index) => {
                const isLast = index === breadcrumb.length - 1;
                return (
                  <li key={`${item.label}-${index}`}>
                    {item.href && !isLast ? (
                      <Link href={item.href}>{item.label}</Link>
                    ) : (
                      <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}
