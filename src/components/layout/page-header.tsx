import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './page-header.module.scss';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  /** Breadcrumb after the title, e.g. 쇼핑몰 관리 / 상품 관리. */
  breadcrumb: Crumb[];
  /** Buttons on the right (Figma "button group"), e.g. 등록. */
  actions?: ReactNode;
}

/** Figma "pageHeader": 24px bold title, grey breadcrumb with "/" separators, actions on the right. */
export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header className={styles['page-header']}>
      <div className={styles['page-heading']}>
        <h1 className={styles['page-title']}>{title}</h1>
        <nav aria-label="현재 위치" className={styles['breadcrumb']}>
          <ol>
            {breadcrumb.map((crumb, index) => (
              <li key={crumb.label}>
                {index > 0 && (
                  <span className={styles['separator']} aria-hidden>
                    /
                  </span>
                )}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current={index === breadcrumb.length - 1 ? 'page' : undefined}>{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      {actions && <div className={styles['page-actions']}>{actions}</div>}
    </header>
  );
}
