"use client";

import styles from "./Pagination.module.scss";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Page numbers shown at once (Figma 8.1.0 shows 10). */
  window?: number;
}

/** Figma 8.1.0 pagination: ‹ 1 2 … 10 ›, current page in a brand-colour circle. */
export function Pagination({ page, totalPages, onChange, window: size = 10 }: Props) {
  if (totalPages <= 1) return null;
  const start = Math.floor((page - 1) / size) * size + 1;
  const end = Math.min(start + size - 1, totalPages);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        ‹
      </button>
      <ol className={styles.pages}>
        {pages.map((n) => (
          <li key={n}>
            <button
              type="button"
              className={`${styles.page} ${n === page ? styles.current : ""}`}
              onClick={() => onChange(n)}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
            >
              {n}
            </button>
          </li>
        ))}
      </ol>
      <button
        type="button"
        className={styles.arrow}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
