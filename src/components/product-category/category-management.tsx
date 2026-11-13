'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { StateBlock } from '@/components/common/state-block';
import { canReorderSiblings } from '@/config/shared-data';
import { queryKeys } from '@/hooks/api/query-keys';
import {
  useCanCreateTopLevel,
  useCategorySearch,
  useDeleteCategory,
  useReorderCategories,
  useTopCategories,
} from '@/hooks/api/product-category/use-product-categories';
import { errorMessage } from '@/lib/api/error-messages';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { ProductCategoryService } from '@/services/product-category-service';
import { CHILD_LEVEL, LEVEL_LABEL, type CategoryLevel, type CategoryNode, type ProductCategory } from '@/types/product-category';
import { CategoryFormDialog, type CategoryDialogState } from './category-form-dialog';
import { CategoryTreeNode } from './category-tree-node';
import {
  CategoryTreeContext,
  nodeKey,
  type CategoryTreeContextValue,
  type DeleteRequest,
  type DragState,
  type TreeNodeData,
} from './category-tree-context';
import styles from './product-category.module.scss';

/** Search results (nested) → tree rows. */
function fromSearch(items: ProductCategory[]): TreeNodeData[] {
  return items.map((c) => ({
    id: c.id,
    name: c.name,
    children: c.subCategories.map((s) => ({
      id: s.id,
      name: s.name,
      children: s.childCategories.map((ch) => ({ id: ch.id, name: ch.name })),
    })),
  }));
}

/**
 * 8.2.0 상품 카테고리 관리 — a 3-level tree (대분류 › 중분류 › 소분류).
 * Search term lives in the URL (?q=), so refresh and back keep it.
 */
export function CategoryManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const term = (params.get('q') ?? '').trim();
  const [draft, setDraft] = useState(term);
  // Back/forward changes ?q=; keep the box in step with the URL.
  useEffect(() => setDraft(term), [term]);
  const { can } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const top = useTopCategories();
  const search = useCategorySearch(term);
  const creatable = useCanCreateTopLevel();
  const deleteCategory = useDeleteCategory();
  const reorder = useReorderCategories();

  // Expand state: a default for all nodes plus per-node overrides (so 모두 펼치기/접기 is one click).
  const [allExpanded, setAllExpanded] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [dialog, setDialog] = useState<CategoryDialogState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DeleteRequest | null>(null);
  const [blockedDelete, setBlockedDelete] = useState<DeleteRequest | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = draft.trim();
    router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname, { scroll: false });
  };

  const clearSearch = () => {
    setDraft('');
    router.replace(pathname, { scroll: false });
  };

  const requestDelete = useCallback(
    async (request: DeleteRequest) => {
      const childLevel = CHILD_LEVEL[request.level];
      let childCount = request.childCount;
      if (childLevel && childCount === undefined) {
        // Not loaded yet: ask the API before deciding (never delete a node that has children).
        const children = await queryClient.fetchQuery({
          queryKey: queryKeys.categories.children(childLevel, request.node.id),
          queryFn: () =>
            childLevel === 'subCategory'
              ? ProductCategoryService.subCategories(request.node.id)
              : ProductCategoryService.childCategories(request.node.id),
        });
        childCount = children.length;
      }
      if (childLevel && (childCount ?? 0) > 0) setBlockedDelete({ ...request, childCount });
      else setPendingDelete(request);
    },
    [queryClient],
  );

  const move = useCallback(
    (level: CategoryLevel, parentId: number, from: number, to: number) => {
      if (from === to) return;
      const key = level === 'category' ? queryKeys.categories.topLevel() : queryKeys.categories.children(level, parentId);
      const siblings = queryClient.getQueryData<CategoryNode[]>(key);
      if (!siblings) return;
      const ids = siblings.map((s) => s.id);
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      reorder.mutate(
        { level, parentId, orderedIds: ids },
        {
          onSuccess: () => toast.show('success', '순서가 변경되었습니다.'),
          onError: (error) => toast.show('error', errorMessage(error)),
        },
      );
    },
    [queryClient, reorder, toast],
  );

  const contextValue = useMemo<CategoryTreeContextValue>(
    () => ({
      isExpanded: (level, id) => (term ? true : (overrides[nodeKey(level, id)] ?? allExpanded)),
      toggle: (level, id) =>
        setOverrides((o) => ({ ...o, [nodeKey(level, id)]: !(o[nodeKey(level, id)] ?? allExpanded) })),
      openDialog: setDialog,
      requestDelete: (request) => void requestDelete(request),
      canReorder: (siblings) => canReorderSiblings(siblings.map((s) => s.name)),
      move,
      dragging,
      setDragging,
    }),
    [term, overrides, allExpanded, requestDelete, move, dragging],
  );

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { level, node } = pendingDelete;
    try {
      await deleteCategory.mutateAsync({ level, id: node.id });
      toast.show('success', `'${node.name}' ${LEVEL_LABEL[level]}가 삭제되었습니다.`);
      setPendingDelete(null);
    } catch (error) {
      toast.show('error', errorMessage(error));
    }
  };

  const canEdit = can('categoryManagement');
  const topCreatable = creatable.data === true;
  const nodes: TreeNodeData[] | undefined = term ? (search.data ? fromSearch(search.data.items) : undefined) : top.data;
  const activeQuery = term ? search : top;

  return (
    <div className={styles['category-page']}>
      <PageHeader
        title="상품 카테고리 관리"
        breadcrumb={[{ label: '쇼핑몰 관리' }, { label: '상품 카테고리 관리' }]}
        actions={
          canEdit && (
            <Button
              label="대분류 등록"
              onClick={() => setDialog({ mode: 'add', level: 'category' })}
              disabled={!topCreatable}
              tooltip={topCreatable ? undefined : '대분류 개수가 최대치에 도달하여 새 대분류를 등록할 수 없습니다.'}
              tooltipOptions={{ showOnDisabled: true, position: 'bottom' }}
            />
          )
        }
      />

      <section className={styles['category-panel']} aria-label="카테고리 트리">
        <div className={styles['toolbar']}>
          <form role="search" className={styles['search-box']} onSubmit={submitSearch}>
            <label htmlFor="category-search" className="sr-only">
              카테고리 검색
            </label>
            <i className="pi pi-search" aria-hidden />
            <input
              id="category-search"
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="카테고리 검색..."
              maxLength={50}
            />
            {term && (
              <button type="button" className={styles['link-button']} onClick={clearSearch}>
                초기화
              </button>
            )}
            <button type="submit" className={styles['search-submit']} aria-label="검색">
              검색
            </button>
          </form>
          <div className={styles['toolbar-buttons']}>
            <Button type="button" label="모두 펼치기" outlined onClick={() => (setAllExpanded(true), setOverrides({}))} disabled={Boolean(term)} />
            <Button type="button" label="모두 접기" outlined onClick={() => (setAllExpanded(false), setOverrides({}))} disabled={Boolean(term)} />
          </div>
        </div>

        {canEdit && !topCreatable && creatable.isSuccess && (
          <p className={styles['notice']} role="note">
            대분류 개수가 최대치에 도달하여 새 대분류는 등록할 수 없습니다. 중분류·소분류는 각 행의 [+] 버튼으로 등록하세요.
          </p>
        )}

        <CategoryTreeContext.Provider value={contextValue}>
          {activeQuery.isLoading ? (
            <StateBlock variant="loading" title="카테고리를 불러오는 중입니다." />
          ) : activeQuery.isError ? (
            <StateBlock
              variant="error"
              title="카테고리를 불러오지 못했습니다."
              description={errorMessage(activeQuery.error)}
              action={<Button label="다시 시도" onClick={() => void activeQuery.refetch()} />}
            />
          ) : !nodes || nodes.length === 0 ? (
            <StateBlock variant="empty" title={term ? '검색 결과가 없습니다.' : '등록된 카테고리가 없습니다.'} />
          ) : (
            <ul className={styles['tree']} aria-label="상품 카테고리">
              {nodes.map((node, index) => (
                <CategoryTreeNode
                  key={node.id}
                  node={node}
                  level="category"
                  presetChildren={term ? (node.children ?? []) : undefined}
                  reorderable={!term && canReorderSiblings(nodes.map((n) => n.name))}
                  index={index}
                  siblingCount={nodes.length}
                />
              ))}
            </ul>
          )}
        </CategoryTreeContext.Provider>
        {term && search.data && (
          <p className={styles['result-count']} aria-live="polite">
            검색 결과 대분류 {search.data.items.length.toLocaleString('en-US')}개
          </p>
        )}
      </section>

      <CategoryFormDialog state={dialog} onClose={() => setDialog(null)} />

      <Dialog
        visible={pendingDelete !== null}
        header="카테고리 삭제"
        onHide={() => !deleteCategory.isPending && setPendingDelete(null)}
        className={styles['category-dialog']}
        draggable={false}
        footer={
          <div className={styles['dialog-footer']}>
            <Button label="취소" outlined onClick={() => setPendingDelete(null)} disabled={deleteCategory.isPending} />
            <Button label="삭제" severity="danger" onClick={() => void confirmDelete()} loading={deleteCategory.isPending} autoFocus />
          </div>
        }
      >
        {pendingDelete && (
          <p className={styles['dialog-text']}>
            &apos;{pendingDelete.node.name}&apos; {LEVEL_LABEL[pendingDelete.level]}를 삭제하시겠습니까?
            <br />
            삭제한 카테고리는 되돌릴 수 없습니다.
          </p>
        )}
      </Dialog>

      <Dialog
        visible={blockedDelete !== null}
        header="삭제할 수 없습니다"
        onHide={() => setBlockedDelete(null)}
        className={styles['category-dialog']}
        draggable={false}
        footer={<Button label="확인" onClick={() => setBlockedDelete(null)} autoFocus />}
      >
        {blockedDelete && (
          <p className={styles['dialog-text']}>
            &apos;{blockedDelete.node.name}&apos;에 하위 카테고리 {blockedDelete.childCount}개가 있어 삭제할 수 없습니다.
            <br />
            하위 카테고리를 먼저 삭제해 주세요.
          </p>
        )}
      </Dialog>
    </div>
  );
}
