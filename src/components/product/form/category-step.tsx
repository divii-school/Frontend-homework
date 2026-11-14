'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useChildCategories, useTopCategories } from '@/hooks/api/product-category/use-product-categories';
import { decodeEntities } from '@/lib/text';
import { formatCategoryPath } from '@/lib/format';
import type { CategoryNode } from '@/types/product-category';
import type { ProductFormInput } from './product-form-schema';
import styles from './product-form.module.scss';

interface Props {
  /** 8.1.2: the category cannot be changed after registration. */
  readOnly: boolean;
  /** Names to show in read-only mode (from the product details). */
  currentPath?: string;
}

/** Step 3 — 카테고리 (8.1.1 ⑩): three columns, each loaded when the one before it is chosen. */
export function CategoryStep({ readOnly, currentPath }: Props) {
  const { control, setValue, formState } = useFormContext<ProductFormInput>();
  const [categoryId, subCategoryId, childCategoryId] = useWatch({
    control,
    name: ['categoryId', 'subCategoryId', 'childCategoryId'],
  });

  const top = useTopCategories();
  const subs = useChildCategories('subCategory', categoryId, Boolean(categoryId) && !readOnly);
  const children = useChildCategories('childCategory', subCategoryId, Boolean(subCategoryId) && !readOnly);

  if (readOnly) {
    return (
      <div className={styles['step-body']}>
        <p className={styles['readonly-path']}>{currentPath ? decodeEntities(currentPath) : '-'}</p>
        <p className={styles['field-help']}>카테고리는 등록 후 수정할 수 없습니다.</p>
      </div>
    );
  }

  const errors = formState.errors;
  return (
    <div className={styles['step-body']}>
      <div className={styles['category-columns']}>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryColumn
              id="categoryId"
              title="대분류"
              nodes={top.data}
              loading={top.isLoading}
              failed={top.isError}
              value={field.value}
              onSelect={(id) => {
                field.onChange(id);
                // A new 대분류 invalidates the levels below it.
                setValue('subCategoryId', undefined as unknown as number);
                setValue('childCategoryId', undefined as unknown as number);
              }}
              error={errors.categoryId?.message}
              emptyText="대분류가 없습니다."
            />
          )}
        />
        <Controller
          control={control}
          name="subCategoryId"
          render={({ field }) => (
            <CategoryColumn
              id="subCategoryId"
              title="중분류"
              nodes={categoryId ? subs.data : undefined}
              loading={Boolean(categoryId) && subs.isLoading}
              failed={subs.isError}
              value={field.value}
              onSelect={(id) => {
                field.onChange(id);
                setValue('childCategoryId', undefined as unknown as number);
              }}
              error={errors.subCategoryId?.message}
              emptyText={categoryId ? '등록된 중분류가 없습니다.' : '대분류를 먼저 선택해 주세요.'}
            />
          )}
        />
        <Controller
          control={control}
          name="childCategoryId"
          render={({ field }) => (
            <CategoryColumn
              id="childCategoryId"
              title="소분류"
              nodes={subCategoryId ? children.data : undefined}
              loading={Boolean(subCategoryId) && children.isLoading}
              failed={children.isError}
              value={field.value}
              onSelect={field.onChange}
              error={errors.childCategoryId?.message}
              emptyText={subCategoryId ? '등록된 소분류가 없습니다.' : '중분류를 먼저 선택해 주세요.'}
            />
          )}
        />
      </div>
      <p className={styles['field-help']} aria-live="polite">
        선택한 카테고리:{' '}
        {decodeEntities(
          formatCategoryPath(
            top.data?.find((n) => n.id === categoryId)?.name,
            subs.data?.find((n) => n.id === subCategoryId)?.name,
            children.data?.find((n) => n.id === childCategoryId)?.name,
          ),
        )}
      </p>
    </div>
  );
}

interface ColumnProps {
  id: string;
  title: string;
  nodes: CategoryNode[] | undefined;
  loading: boolean;
  failed: boolean;
  value: number | undefined;
  onSelect: (id: number) => void;
  error?: string;
  emptyText: string;
}

/** One selectable column, built as a radio group so it works with the keyboard and screen readers. */
function CategoryColumn({ id, title, nodes, loading, failed, value, onSelect, error, emptyText }: ColumnProps) {
  const headingId = `${id}-title`;
  return (
    <fieldset className={`${styles['category-column']} ${error ? styles['is-invalid'] : ''}`} aria-describedby={error ? `${id}-error` : undefined}>
      <legend id={headingId} className={styles['category-column-title']}>
        {title} <span className={styles['required']} aria-hidden>*</span>
      </legend>
      <div className={styles['category-options']}>
        {loading ? (
          <p className={styles['column-state']}>불러오는 중…</p>
        ) : failed ? (
          <p className={styles['column-state']} role="alert">
            목록을 불러오지 못했습니다.
          </p>
        ) : !nodes || nodes.length === 0 ? (
          <p className={styles['column-state']}>{emptyText}</p>
        ) : (
          nodes.map((node) => (
            <label key={node.id} className={`${styles['category-option']} ${value === node.id ? styles['is-selected'] : ''}`}>
              <input type="radio" name={id} checked={value === node.id} onChange={() => onSelect(node.id)} className="sr-only" />
              {decodeEntities(node.name)}
            </label>
          ))
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className={styles['field-error']} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
