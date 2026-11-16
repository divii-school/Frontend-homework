"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { breadcrumbFor } from "@/config/navigation";
import styles from "./PageHeader.module.scss";

/** Figma "pageHeader": 24px bold title, breadcrumb from the navigation config, actions on the right. */
export function PageHeader({ title, actions, crumb }: { title: string; actions?: ReactNode; /** Extra last breadcrumb item (e.g. "Product Registration"). */ crumb?: string }) {
  const base = breadcrumbFor(usePathname());
  const crumbs = crumb && base.length ? [...base, crumb] : base;
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className={styles.crumbs}>
              {crumbs.map((crumb, i) => (
                <li key={crumb} aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                  {crumb}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
