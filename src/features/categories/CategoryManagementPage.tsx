'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { confirmDialog } from 'primereact/confirmdialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { QueryState, errorText } from '@/components/common/QueryState';
import { useToast } from '@/components/providers/ToastProvider';
import { useCan } from '@/features/auth/AuthProvider';
import { CategoryTree, nodeKey } from './components/CategoryTree';
import { CategoryFormDialog, type CategoryFormTarget } from './components/CategoryFormDialog';
import { useCategoryTree, useDeleteCategory, useSaveCategory } from './useCategories';
import { LEVEL_LABEL, type CategoryLevel, type CategoryNode } from './types';
import styles from './CategoryManagementPage.module.scss';

function allKeys(nodes: CategoryNode[], acc: string[] = []): string[] {
  nodes.forEach((n) => {
    if (n.children.length) {
      acc.push(nodeKey(n));
      allKeys(n.children, acc);
    }
  });
  return acc;
}

export function CategoryManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const search = params.get('search') ?? '';
  const [draft, setDraft] = useState(search);
  const canWrite = useCan('category.write');
  const toast = useToast();

  const { data = [], isLoading, error, refetch } = useCategoryTree(search);
  const save = useSaveCategory();
  const del = useDeleteCategory();

  // Expanded by default; the user can expand/collapse all.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const expanded = useMemo(() => new Set(allKeys(data).filter((k) => !collapsed.has(k))), [data, collapsed]);
  const [formTarget, setFormTarget] = useState<CategoryFormTarget | null>(null);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams(params.toString());
    if (draft.trim()) q.set('search', draft.trim());
    else q.delete('search');
    router.replace(`${pathname}?${q.toString()}`);
  };

  const toggle = (key: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const submitForm = (name: string) => {
    if (!formTarget) return;
    save.mutate(
      { mode: formTarget.mode, level: formTarget.level, id: formTarget.id, name, parentId: formTarget.parentId },
      {
        onSuccess: () => {
          toast.show('success', formTarget.mode === 'create' ? '등록되었습니다.' : '수정되었습니다.');
          setFormTarget(null);
        },
      },
    );
  };

  const askDelete = (node: CategoryNode) => {
    if (node.children.length) {
      toast.show('warn', '하위 카테고리가 있어 삭제할 수 없습니다. 하위 카테고리를 먼저 삭제해 주세요.');
      return;
    }
    confirmDialog({
      header: '삭제 확인',
      message: `[${node.id}] ${node.name} ${LEVEL_LABEL[node.level]}를 삭제하시겠습니까?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '삭제',
      rejectLabel: '취소',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: () =>
        del.mutate(
          { level: node.level, id: node.id },
          {
            onSuccess: () => toast.show('success', '삭제되었습니다.'),
            onError: (err) => toast.show('error', errorText(err)),
          },
        ),
    });
  };

  return (
    <>
      <PageHeader title="상품 카테고리 관리" crumbs={['쇼핑몰 관리', '상품 카테고리 관리']} />

      <div className={styles.toolbar}>
        <form onSubmit={onSearch} role="search" className={styles.search}>
          <label htmlFor="category-search" className="sr-only">
            카테고리 검색
          </label>
          <IconField iconPosition="left">
            <InputIcon className="pi pi-search" />
            <InputText
              id="category-search"
              placeholder="카테고리 검색"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </IconField>
          <Button type="submit" label="검색" outlined />
        </form>
        <div className={styles.toolbarRight}>
          <Button label="모두 펼치기" outlined onClick={() => setCollapsed(new Set())} />
          <Button label="모두 접기" outlined onClick={() => setCollapsed(new Set(allKeys(data)))} />
          {canWrite && (
            <Button
              label="대분류 등록"
              onClick={() =>
                setFormTarget({ mode: 'create', level: 1, siblingNames: data.map((n) => n.name) })
              }
            />
          )}
        </div>
      </div>

      <section className={styles.panel} aria-busy={isLoading}>
        <QueryState
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && !error && data.length === 0}
          emptyText={search ? '검색 결과가 없습니다.' : '등록된 카테고리가 없습니다.'}
          onRetry={() => void refetch()}
        />
        {!isLoading && !error && data.length > 0 && (
          <CategoryTree
            nodes={data}
            expanded={expanded}
            canWrite={canWrite}
            onToggle={toggle}
            onAddChild={(parent) =>
              setFormTarget({
                mode: 'create',
                level: (parent.level + 1) as CategoryLevel,
                parentId: parent.id,
                siblingNames: parent.children.map((c) => c.name),
              })
            }
            onEdit={(node, siblings) =>
              setFormTarget({
                mode: 'edit',
                level: node.level,
                id: node.id,
                parentId: node.parentId,
                name: node.name,
                siblingNames: siblings.map((s) => s.name),
              })
            }
            onDelete={askDelete}
          />
        )}
      </section>

      <CategoryFormDialog
        target={formTarget}
        saving={save.isPending}
        serverError={save.error ? errorText(save.error) : undefined}
        onSubmit={submitForm}
        onHide={() => {
          setFormTarget(null);
          save.reset();
        }}
      />
    </>
  );
}
