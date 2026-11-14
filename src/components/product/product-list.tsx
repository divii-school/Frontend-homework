'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { AppDropdown } from '@/components/common/app-dropdown';
import { Paginator } from 'primereact/paginator';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { StateBlock } from '@/components/common/state-block';
import { ROUTES } from '@/config/app-routes';
import { useDeleteProducts, useProductList, useUpdateProductVisibility } from '@/hooks/api/product/use-products';
import { useExportProducts } from '@/hooks/api/product/use-export-products';
import { useProductListParams } from '@/hooks/use-product-list-params';
import { PAGE_SIZES, SEARCH_MAX } from '@/lib/product-list-params';
import { errorMessage } from '@/lib/api/error-messages';
import { decodeEntities } from '@/lib/text';
import { formatCategoryPath, formatDateTimeSlash, formatNumber, formatPriceSymbol } from '@/lib/format';
import { rememberListQuery } from '@/lib/list-memory';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import type { ProductListItem, ProductSearchType } from '@/types/product';
import styles from './product.module.scss';

/** 8.1.0: at most 100 rows may be selected at once. */
export const MAX_SELECTION = 100;

const SEARCH_TYPES: { label: string; value: ProductSearchType }[] = [
  { label: '상품명', value: 'productName' },
  { label: '카테고리', value: 'categoryName' },
];

const VISIBILITY: { label: string; value: boolean }[] = [
  { label: '예', value: true },
  { label: '아니오', value: false },
];

/** 8.1.0 상품 관리: search, paging, selection + bulk delete, inline 노출, CSV export. State lives in the URL. */
export function ProductList() {
  const { params, setParams, queryString } = useProductListParams();
  const { can } = useAuth();
  const toast = useToast();
  const canEdit = can('productManagement');

  const query = useMemo(
    () => ({ page: params.page, limit: params.size, type: params.type, search: params.q || undefined }),
    [params],
  );
  const list = useProductList(query);
  const visibility = useUpdateProductVisibility();
  const deleteProducts = useDeleteProducts();
  const { exportCsv, progress, exporting } = useExportProducts();

  const [draftType, setDraftType] = useState<ProductSearchType>(params.type);
  const [draftQ, setDraftQ] = useState(params.q);
  const [selected, setSelected] = useState<ProductListItem[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // URL changed (back/forward, link): show the same search in the inputs.
  useEffect(() => {
    setDraftType(params.type);
    setDraftQ(params.q);
  }, [params.type, params.q]);

  // A new search starts a new selection; paging keeps it (selection is by id).
  useEffect(() => setSelected([]), [params.q, params.type]);

  // Remember where the list was, so 목록으로 on detail/edit pages comes back here.
  useEffect(() => rememberListQuery(queryString), [queryString]);

  // A page number past the end (e.g. after deleting the last rows) → jump to the last page.
  const totalPage = list.data?.totalPage ?? 0;
  useEffect(() => {
    if (list.data && totalPage > 0 && params.page > totalPage) setParams({ page: totalPage });
  }, [list.data, totalPage, params.page, setParams]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    setParams({ q: draftQ.trim(), type: draftType });
  };

  const rows = useMemo(() => list.data?.items ?? [], [list.data]);
  const total = list.data?.totalRecords ?? 0;
  const selectedIds = useMemo(() => new Set(selected.map((p) => p.id)), [selected]);
  // DataTable memoises its rows and would keep showing old checkbox states; new row objects
  // whenever the selection changes make it redraw them.
  const tableRows = useMemo(() => rows.map((r) => ({ ...r, selectedTick: selectedIds.has(r.id) })), [rows, selectedIds]);

  /** Adds rows to the selection without going over the 100-row limit (8.1.0). */
  const addToSelection = (more: ProductListItem[]) => {
    const fresh = more.filter((r) => !selectedIds.has(r.id));
    const room = MAX_SELECTION - selected.length;
    if (fresh.length > room) toast.show('warn', `한 번에 최대 ${MAX_SELECTION}개까지 선택할 수 있습니다.`);
    setSelected([...selected, ...fresh.slice(0, Math.max(room, 0))]);
  };

  const toggleRow = (row: ProductListItem, checked: boolean) =>
    checked ? addToSelection([row]) : setSelected(selected.filter((p) => p.id !== row.id));

  const togglePage = (checked: boolean) =>
    checked ? addToSelection(rows) : setSelected(selected.filter((p) => !rows.some((r) => r.id === p.id)));

  const changeVisibility = (product: ProductListItem, visible: boolean) => {
    visibility.mutate(
      { id: product.id, visible },
      {
        onSuccess: () => toast.show('success', `'${decodeEntities(product.productName)}' 노출 여부가 변경되었습니다.`),
        onError: (error) => toast.show('error', errorMessage(error)),
      },
    );
  };

  const runDelete = async () => {
    const ids = selected.map((p) => p.id);
    try {
      await deleteProducts.mutateAsync(ids);
      toast.show('success', `${formatNumber(ids.length)}개 상품이 삭제되었습니다.`);
      setSelected([]);
      setConfirmDelete(false);
    } catch (error) {
      toast.show('error', errorMessage(error));
    }
  };

  const runExport = async () => {
    try {
      const count = await exportCsv({ type: params.type, search: params.q || undefined });
      toast.show('success', `${formatNumber(count)}개 상품을 CSV로 내보냈습니다.`);
    } catch (error) {
      toast.show('error', `내보내기에 실패했습니다. ${errorMessage(error)}`);
    }
  };

  return (
    <div className={styles['product-page']}>
      <PageHeader
        title="상품 관리"
        breadcrumb={[{ label: '쇼핑몰 관리' }, { label: '상품 관리' }]}
        actions={canEdit && <Link href={ROUTES.productNew} className={`p-button p-component ${styles['register-link']}`}>등록</Link>}
      />

      <section className={styles['panel']} aria-label="상품 목록">
        <div className={styles['toolbar']}>
          <form role="search" className={styles['search']} onSubmit={submitSearch}>
            <label htmlFor="product-search-type" className="sr-only">
              검색 항목
            </label>
            <AppDropdown
              label="검색 항목"
              inputId="product-search-type"
              value={draftType}
              options={SEARCH_TYPES}
              onChange={(e) => setDraftType(e.value as ProductSearchType)}
              className={styles['search-type']}
            />
            <div className={styles['search-input']}>
              <label htmlFor="product-search" className="sr-only">
                검색어
              </label>
              <input
                id="product-search"
                type="search"
                value={draftQ}
                maxLength={SEARCH_MAX}
                onChange={(e) => setDraftQ(e.target.value)}
                placeholder="검색어를 입력해 주세요."
              />
              <button type="submit" className={styles['search-button']} aria-label="검색">
                <i className="pi pi-search" aria-hidden />
              </button>
            </div>
          </form>

          <div className={styles['toolbar-right']}>
            {canEdit && (
              <Button
                type="button"
                label={selected.length ? `삭제 (${formatNumber(selected.length)})` : '삭제'}
                outlined
                disabled={selected.length === 0}
                onClick={() => setConfirmDelete(true)}
              />
            )}
            <Button
              type="button"
              label={exporting ? `내보내는 중 ${formatNumber(progress?.done ?? 0)}/${formatNumber(progress?.total ?? 0)}` : 'CSV 내보내기'}
              icon="pi pi-download"
              outlined
              disabled={exporting || total === 0}
              onClick={() => void runExport()}
            />
            <p className={styles['total']} aria-live="polite">
              총 게시물 <strong>{formatNumber(total)}</strong>건
            </p>
          </div>
        </div>

        {list.isError && !list.data ? (
          <StateBlock
            variant="error"
            title="상품 목록을 불러오지 못했습니다."
            description={errorMessage(list.error)}
            action={<Button label="다시 시도" onClick={() => void list.refetch()} />}
          />
        ) : (
          <div className={styles['table-wrap']}>
            <DataTable
              value={tableRows}
              dataKey="id"
              loading={list.isFetching}
              rowClassName={(p: ProductListItem) => (selectedIds.has(p.id) ? styles['is-selected'] : '')}
              className={styles['table']}
              emptyMessage={
                list.isLoading ? (
                  <StateBlock variant="loading" title="상품 목록을 불러오는 중입니다." />
                ) : (
                  <StateBlock variant="empty" title={params.q ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'} />
                )
              }
              aria-label="상품 목록"
            >
              {canEdit && (
                <Column
                  headerClassName={styles['col-select']}
                  header={
                    <label className={styles['check']}>
                      <input
                        type="checkbox"
                        checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                        onChange={(e) => togglePage(e.target.checked)}
                        aria-label="현재 페이지 전체 선택"
                      />
                      <span>선택</span>
                    </label>
                  }
                  body={(p: ProductListItem) => (
                    <input
                      type="checkbox"
                      className={styles['row-check']}
                      checked={selectedIds.has(p.id)}
                      onChange={(e) => toggleRow(p, e.target.checked)}
                      aria-label={`${decodeEntities(p.productName)} 선택`}
                    />
                  )}
                />
              )}
              <Column header="썸네일" body={thumbnail} headerClassName={styles['col-thumb']} />
              <Column
                header="상품명"
                body={(p: ProductListItem) => (
                  <Link href={ROUTES.productDetails(p.id)} className={styles['name-link']}>
                    {decodeEntities(p.productName)}
                  </Link>
                )}
              />
              <Column header="판매가" body={(p: ProductListItem) => formatPriceSymbol(p.price)} className={styles['col-price']} />
              <Column
                header="카테고리(과정)"
                body={(p: ProductListItem) =>
                  decodeEntities(formatCategoryPath(p.category?.name, p.subCategory?.name, p.childCategory?.name))
                }
              />
              <Column
                header="노출 여부"
                body={(p: ProductListItem) =>
                  canEdit ? (
                    <AppDropdown
                      label={`${decodeEntities(p.productName)} 노출 여부`}
                      value={p.isVisible}
                      options={VISIBILITY}
                      onChange={(e) => changeVisibility(p, e.value as boolean)}
                      className={styles['visibility']}
                    />
                  ) : p.isVisible ? (
                    '예'
                  ) : (
                    '아니오'
                  )
                }
              />
              <Column header="등록일" body={(p: ProductListItem) => formatDateTimeSlash(p.createdAt)} className={styles['col-date']} />
            </DataTable>
          </div>
        )}

        {total > 0 && (
          <Paginator
            first={(params.page - 1) * params.size}
            rows={params.size}
            totalRecords={total}
            rowsPerPageOptions={[...PAGE_SIZES]}
            onPageChange={(e) => (e.rows !== params.size ? setParams({ size: e.rows }) : setParams({ page: e.page + 1 }))}
            className={styles['paginator']}
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          />
        )}
      </section>

      <Dialog
        visible={confirmDelete}
        header="상품 삭제"
        onHide={() => !deleteProducts.isPending && setConfirmDelete(false)}
        className={styles['dialog']}
        draggable={false}
        footer={
          <div className={styles['dialog-footer']}>
            <Button label="취소" outlined onClick={() => setConfirmDelete(false)} disabled={deleteProducts.isPending} />
            <Button label="삭제" severity="danger" onClick={() => void runDelete()} loading={deleteProducts.isPending} autoFocus />
          </div>
        }
      >
        <p className={styles['dialog-text']}>
          선택한 {formatNumber(selected.length)}개 상품을 삭제하시겠습니까?
          <br />
          삭제한 상품은 되돌릴 수 없습니다.
        </p>
      </Dialog>
    </div>
  );
}

function thumbnail(p: ProductListItem) {
  return p.image ? (
    <Image src={p.image} alt={`${decodeEntities(p.productName)} 대표 이미지`} width={56} height={56} className={styles['thumb']} />
  ) : (
    <span className={styles['thumb-empty']} role="img" aria-label="대표 이미지 없음">
      <i className="pi pi-image" aria-hidden />
    </span>
  );
}
