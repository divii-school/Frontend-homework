'use client';

import { useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSaveCategory } from '@/hooks/api/product-category/use-product-categories';
import { errorMessage } from '@/lib/api/error-messages';
import { useToast } from '@/providers/toast-provider';
import { LEVEL_LABEL, type CategoryLevel, type CategorySaveRequest } from '@/types/product-category';
import styles from './product-category.module.scss';

/** Longest name we accept; the API itself only requires a non-empty string. */
export const CATEGORY_NAME_MAX = 50;

/** Figma 8.2.0 validation: no empty name, spaces at both ends removed. */
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '카테고리명을 입력해 주세요.')
    .max(CATEGORY_NAME_MAX, `카테고리명은 ${CATEGORY_NAME_MAX}자 이하로 입력해 주세요.`),
});
type FormValues = z.infer<typeof schema>;

export type CategoryDialogState =
  | { mode: 'add'; level: CategoryLevel; parentId?: number; parentName?: string }
  | { mode: 'edit'; level: CategoryLevel; id: number; name: string; parentId?: number };

interface Props {
  state: CategoryDialogState | null;
  onClose: () => void;
}

/** Add or rename a category at any level. The API keeps codes ([id]) itself, so only the name is edited. */
export function CategoryFormDialog({ state, onClose }: Props) {
  const save = useSaveCategory();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  useEffect(() => {
    if (state) reset({ name: state.mode === 'edit' ? state.name : '' });
  }, [state, reset]);

  if (!state) return null;
  const levelLabel = LEVEL_LABEL[state.level];
  const title = state.mode === 'add' ? `${levelLabel} 등록` : `${levelLabel} 수정`;

  const onSubmit = handleSubmit(async ({ name }) => {
    const request = toRequest(state, name);
    try {
      await save.mutateAsync({ request, id: state.mode === 'edit' ? state.id : undefined });
      toast.show('success', state.mode === 'add' ? `${levelLabel}가 등록되었습니다.` : `${levelLabel}가 수정되었습니다.`);
      onClose();
    } catch (error) {
      // Keep the dialog open with what was typed; show the API's reason under the field.
      setError('name', { message: errorMessage(error) });
    }
  });

  return (
    <Dialog
      visible
      header={title}
      onHide={() => !save.isPending && onClose()}
      className={styles['category-dialog']}
      modal
      draggable={false}
      footer={
        <div className={styles['dialog-footer']}>
          <Button type="button" label="취소" outlined onClick={onClose} disabled={save.isPending} />
          <Button type="submit" form="category-form" label={state.mode === 'add' ? '등록' : '저장'} loading={save.isPending} />
        </div>
      }
    >
      <form id="category-form" onSubmit={onSubmit} noValidate className={styles['dialog-form']}>
        {state.mode === 'add' && state.parentName && (
          <p className={styles['dialog-parent']}>
            상위 카테고리: <strong>{state.parentName}</strong>
          </p>
        )}
        <label htmlFor="category-name" className={styles['field-label']}>
          카테고리명 <span aria-hidden className={styles['required']}>*</span>
        </label>
        <InputText
          id="category-name"
          autoFocus
          maxLength={CATEGORY_NAME_MAX + 10}
          placeholder="카테고리명을 입력해 주세요."
          className={errors.name ? 'p-invalid' : undefined}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? 'category-name-error' : 'category-name-help'}
          aria-required
          {...register('name')}
        />
        {errors.name ? (
          <small id="category-name-error" className={styles['field-error']} role="alert">
            {errors.name.message}
          </small>
        ) : (
          <small id="category-name-help" className={styles['field-help']}>
            앞뒤 공백은 자동으로 제거됩니다. 최대 {CATEGORY_NAME_MAX}자.
          </small>
        )}
      </form>
    </Dialog>
  );
}

function toRequest(state: CategoryDialogState, name: string): CategorySaveRequest {
  switch (state.level) {
    case 'category':
      return { level: 'category', name };
    case 'subCategory':
      return { level: 'subCategory', name, categoryId: requireParent(state) };
    case 'childCategory':
      return { level: 'childCategory', name, subCategoryId: requireParent(state) };
  }
}

function requireParent(state: CategoryDialogState): number {
  if (state.parentId === undefined) throw new Error('A sub-level category needs its parent id');
  return state.parentId;
}
