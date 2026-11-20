'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { LEVEL_LABEL, NAME_MAX, type CategoryLevel } from '../types';

export interface CategoryFormTarget {
  mode: 'create' | 'edit';
  level: CategoryLevel;
  id?: number;
  parentId?: number;
  name?: string;
  /** Names of siblings, for the duplicate check. */
  siblingNames: string[];
}

export function validateCategoryName(name: string, siblings: string[], current?: string): string {
  const v = name.trim();
  if (!v) return '카테고리명을 입력해 주세요.';
  if (v.length > NAME_MAX) return `카테고리명은 ${NAME_MAX}자 이내로 입력해 주세요.`;
  if (siblings.some((s) => s.trim() === v && s.trim() !== (current ?? '').trim()))
    return '이미 등록된 카테고리명입니다.';
  return '';
}

export function CategoryFormDialog({
  target,
  saving,
  serverError,
  onSubmit,
  onHide,
}: {
  target: CategoryFormTarget | null;
  saving: boolean;
  serverError?: string;
  onSubmit: (name: string) => void;
  onHide: () => void;
}) {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setName(target?.name ?? '');
    setTouched(false);
  }, [target]);

  const error = target ? validateCategoryName(name, target.siblingNames, target.name) : '';
  const title = target ? `${LEVEL_LABEL[target.level]} ${target.mode === 'create' ? '등록' : '수정'}` : '';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!error) onSubmit(name.trim());
  };

  return (
    <Dialog header={title} visible={!!target} onHide={onHide} style={{ width: 'min(420px, 92vw)' }} modal>
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="category-name" className="required">
            카테고리명
          </label>
          <InputText
            id="category-name"
            value={name}
            maxLength={NAME_MAX + 10}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            className={touched && error ? 'p-invalid' : ''}
            aria-invalid={touched && !!error}
            aria-describedby="category-name-msg"
            autoFocus
          />
          <small id="category-name-msg" className={touched && error ? 'p-error' : 'muted'}>
            {touched && error ? error : `${name.trim().length}/${NAME_MAX}`}
          </small>
          {serverError && (
            <small className="p-error" role="alert">
              {serverError}
            </small>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button type="button" label="취소" outlined onClick={onHide} />
          <Button type="submit" label={target?.mode === 'create' ? '등록' : '저장'} loading={saving} />
        </div>
      </form>
    </Dialog>
  );
}
