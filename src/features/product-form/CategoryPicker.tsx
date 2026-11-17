"use client";

import { useId } from "react";
import { useChildCategories, useMajorCategories, useSubCategories } from "@/hooks/useProductForm";
import type { CategoryRef } from "@/types/product";
import styles from "./ProductForm.module.scss";

interface Props {
  categoryId: number | null;
  subCategoryId: number | null;
  childCategoryId: number | null;
  onChange: (next: { categoryId: number | null; subCategoryId: number | null; childCategoryId: number | null }) => void;
  errors: { categoryId?: string; subCategoryId?: string; childCategoryId?: string };
}

/** Figma 8.1.1 #10: Major / Medium / Minor columns. Picking a level clears the levels below it. */
export function CategoryPicker({ categoryId, subCategoryId, childCategoryId, onChange, errors }: Props) {
  const majors = useMajorCategories();
  const subs = useSubCategories(categoryId);
  const children = useChildCategories(subCategoryId);

  return (
    <div className={styles["category-columns"]}>
      <Column
        title="Major Category"
        query={majors}
        value={categoryId}
        error={errors.categoryId}
        onSelect={(id) => onChange({ categoryId: id, subCategoryId: null, childCategoryId: null })}
        emptyText="No categories."
      />
      <Column
        title="Medium Category"
        query={categoryId === null ? null : subs}
        value={subCategoryId}
        error={errors.subCategoryId}
        onSelect={(id) => onChange({ categoryId, subCategoryId: id, childCategoryId: null })}
        emptyText="No medium categories."
        waitText="Select a major category first."
      />
      <Column
        title="Minor Category"
        query={subCategoryId === null ? null : children}
        value={childCategoryId}
        error={errors.childCategoryId}
        onSelect={(id) => onChange({ categoryId, subCategoryId, childCategoryId: id })}
        emptyText="No minor categories."
        waitText="Select a medium category first."
      />
    </div>
  );
}

interface ColumnQuery {
  data?: CategoryRef[];
  isPending: boolean;
  isError: boolean;
  refetch: () => unknown;
}

function Column({
  title,
  query,
  value,
  error,
  onSelect,
  emptyText,
  waitText,
}: {
  title: string;
  query: ColumnQuery | null;
  value: number | null;
  error?: string;
  onSelect: (id: number) => void;
  emptyText: string;
  waitText?: string;
}) {
  const headingId = useId();
  const errorId = useId();
  return (
    <fieldset className={`${styles["category-column"]} ${error ? styles["column-invalid"] : ""}`} aria-describedby={error ? errorId : undefined}>
      <legend id={headingId} className={styles["column-title"]}>
        {title}
        <span className={styles.required} aria-hidden>
          *
        </span>
      </legend>
      <div className={styles["column-body"]}>
        {query === null ? (
          <p className={styles["column-note"]}>{waitText}</p>
        ) : query.isPending ? (
          <p className={styles["column-note"]} role="status">
            Loading…
          </p>
        ) : query.isError ? (
          <p className={styles["column-note"]} role="alert">
            Couldn&apos;t load.{" "}
            <button type="button" className={styles["link-button"]} onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        ) : !query.data?.length ? (
          <p className={styles["column-note"]}>{emptyText}</p>
        ) : (
          query.data.map((option) => (
            <label key={option.id} className={`${styles.option} ${option.id === value ? styles["option-selected"] : ""}`}>
              <input type="radio" name={headingId} checked={option.id === value} onChange={() => onSelect(option.id)} />
              <span>{option.name}</span>
            </label>
          ))
        )}
      </div>
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </fieldset>
  );
}
