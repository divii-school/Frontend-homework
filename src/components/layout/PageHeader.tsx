import type { ReactNode } from 'react';
import styles from './PageHeader.module.scss';

export function PageHeader({ title, crumbs, actions }: { title: string; crumbs?: string[]; actions?: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{title}</h1>
        {crumbs && (
          <nav aria-label="현재 위치" className={styles.crumbs}>
            {crumbs.join(' > ')}
          </nav>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
