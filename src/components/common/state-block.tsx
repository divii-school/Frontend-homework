import type { ReactNode } from 'react';
import styles from './state-block.module.scss';

type Variant = 'loading' | 'empty' | 'error' | 'forbidden' | 'not-found';

interface StateBlockProps {
  variant: Variant;
  title: string;
  description?: string;
  /** Optional action, e.g. a "다시 시도" button. */
  action?: ReactNode;
}

const ICON: Record<Variant, string> = {
  loading: 'pi pi-spin pi-spinner',
  empty: 'pi pi-inbox',
  error: 'pi pi-exclamation-triangle',
  forbidden: 'pi pi-lock',
  'not-found': 'pi pi-search',
};

/** One look for loading / empty / error / 403 / 404 everywhere (lists, tabs, pages). */
export function StateBlock({ variant, title, description, action }: StateBlockProps) {
  const live = variant === 'loading' ? 'polite' : variant === 'error' ? 'assertive' : undefined;
  return (
    <div
      className={`${styles['state-block']} ${styles[`is-${variant}`] ?? ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={live}
      aria-busy={variant === 'loading'}
    >
      <i className={`${ICON[variant]} ${styles['state-icon']}`} aria-hidden />
      <p className={styles['state-title']}>{title}</p>
      {description && <p className={styles['state-description']}>{description}</p>}
      {action && <div className={styles['state-action']}>{action}</div>}
    </div>
  );
}
