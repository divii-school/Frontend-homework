'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, type DataTableSortEvent, type DataTableStateEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { confirmDialog } from 'primereact/confirmdialog';
import { PageHeader } from '@/components/layout/PageHeader';
import { QueryState, errorText } from '@/components/common/QueryState';
import { useToast } from '@/components/providers/ToastProvider';
import { useCan } from '@/features/auth/AuthProvider';
import { formatDateTime, formatNumber, formatWon } from '@/lib/format';
import { Thumb } from './components/Thumb';
import { exportProductsCsv } from './exportCsv';
import { useDeleteProducts, useProductList, useUpdateProductStatus } from './useProducts';
import { useProductListUrlState, type SortField } from './useProductListUrlState';
import { YES_NO_OPTIONS, type ProductListItem, type SearchType, type YesNo } from './types';
import styles from './ProductListPage.module.scss';

const SEARCH_TYPES: { label: string; value: SearchType }[] = [
  { label: '상품명', value: 'productName' },
  { label: '카테고리', value: 'categoryName' },
];
const MAX_SELECT = 100;

function sortItems(items: ProductListItem[], field: SortField | undefined, order: 1 | -1) {
  if (!field) return items;
  const val = (i: ProductListItem) =>
    field === 'name' ? i.name : field === 'price' ? i.price ?? 0 : new Date(i.createdAt ?? 0).getTime();
  return [...items].sort((a, b) => {
    const x = val(a);
    const y = val(b);
    return (typeof x === 'string' ? x.localeCompare(String(y), 'ko') : x - Number(y)) * order;
  });
}

export function ProductListPage() {
  const router = useRouter();
  const toast = useToast();
  const { state, update } = useProductListUrlState();
  const canCreate = useCan('product.create');
  const canUpdate = useCan('product.update');
  const canDelete = useCan('product.delete');
  const canExport = useCan('product.export');

  const [type, setType] = useState<SearchType>(state.type);
  const [search, setSearch] = useState(state.search);
  useEffect(() => {
    setType(state.type);
    setSearch(state.search);
  }, [state.type, state.search]);

  const query = useProductList({ page: state.page, limit: state.limit, type: state.type, search: state.search });
  const rows = useMemo(
    () => sortItems(query.data?.items ?? [], state.sortField, state.sortOrder),
    [query.data, state.sortField, state.sortOrder],
  );
  const total = query.data?.total ?? 0;

  const [selected, setSelected] = useState<ProductListItem[]>([]);
  useEffect(() => setSelected([]), [state.page, state.limit, state.search, state.type]);

  const del = useDeleteProducts();
  const status = useUpdateProductStatus();
  const [exporting, setExporting] = useState(false);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ type, search: search.trim(), page: 1 });
  };

  const onPage = (e: DataTableStateEvent) => update({ page: (e.page ?? 0) + 1, limit: e.rows });
  const onSort = (e: DataTableSortEvent) =>
    update({ sortField: (e.sortField as SortField) || undefined, sortOrder: e.sortOrder === 1 ? 1 : -1 });

  const askDelete = () => {
    if (!selected.length) {
      toast.show('warn', '삭제할 상품을 선택해 주세요.');
      return;
    }
    confirmDialog({
      header: '삭제 확인',
      message: `선택한 ${selected.length}개 상품을 삭제하시겠습니까?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '삭제',
      rejectLabel: '취소',
      acceptClassName: 'p-button-danger',
      defaultFocus: 'reject',
      accept: () =>
        del.mutate(
          selected.map((s) => s.id),
          {
            onSuccess: () => {
              toast.show('success', '삭제되었습니다.');
              setSelected([]);
            },
            onError: (err) => toast.show('error', errorText(err)),
          },
        ),
    });
  };

  const bulkVisibility = (v: YesNo) => {
    if (!selected.length) {
      toast.show('warn', '변경할 상품을 선택해 주세요.');
      return;
    }
    status.mutate(
      { ids: selected.map((s) => s.id), status: v },
      {
        onSuccess: () => toast.show('success', `${selected.length}개 상품의 노출 상태가 변경되었습니다.`),
        onError: (err) => toast.show('error', errorText(err)),
      },
    );
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const n = await exportProductsCsv({ type: state.type, search: state.search });
      toast.show('success', `${formatNumber(n)}건을 내보냈습니다.`);
    } catch (err) {
      toast.show('error', errorText(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="상품 관리"
        crumbs={['쇼핑몰 관리', '상품 관리']}
        actions={canCreate && <Button label="등록" onClick={() => router.push('/shopping/products/new')} />}
      />

      <div className={styles.toolbar}>
        <form className={styles.search} onSubmit={onSearch} role="search">
          <label htmlFor="search-type" className="sr-only">
            검색 조건
          </label>
          <Dropdown
            inputId="search-type"
            value={type}
            options={SEARCH_TYPES}
            onChange={(e) => setType(e.value)}
            className={styles.type}
          />
          <label htmlFor="product-search" className="sr-only">
            검색어
          </label>
          <InputText
            id="product-search"
            placeholder="검색어를 입력해 주세요."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" icon="pi pi-search" aria-label="검색" outlined />
        </form>
        <div className={styles.bulk}>
          {canDelete && <Button label="삭제" outlined onClick={askDelete} disabled={!selected.length} loading={del.isPending} />}
          {canUpdate && (
            <>
              <Button label="노출" outlined onClick={() => bulkVisibility('yes')} disabled={!selected.length} />
              <Button label="미노출" outlined onClick={() => bulkVisibility('no')} disabled={!selected.length} />
            </>
          )}
          {canExport && <Button label="엑셀 다운로드" icon="pi pi-download" outlined onClick={onExport} loading={exporting} />}
          <span className={styles.total} aria-live="polite">
            총 게시물: {formatNumber(total)}
          </span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {query.error ? (
          <QueryState error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <DataTable
            value={rows}
            dataKey="id"
            lazy
            paginator
            first={(state.page - 1) * state.limit}
            rows={state.limit}
            rowsPerPageOptions={[10, 20, 50]}
            totalRecords={total}
            onPage={onPage}
            sortField={state.sortField}
            sortOrder={state.sortOrder}
            onSort={onSort}
            loading={query.isFetching}
            selectionMode="checkbox"
            selection={selected}
            onSelectionChange={(e) => {
              const v = e.value as ProductListItem[];
              if (v.length > MAX_SELECT) toast.show('warn', `최대 ${MAX_SELECT}개까지 선택할 수 있습니다.`);
              else setSelected(v);
            }}
            emptyMessage={state.search ? '검색 결과가 없습니다.' : '등록된 상품이 없습니다.'}
            paginatorTemplate="PrevPageLink PageLinks NextPageLink RowsPerPageDropdown"
            scrollable
            tableStyle={{ minWidth: 960 }}
            aria-label="상품 목록"
          >
            <Column selectionMode="multiple" headerStyle={{ width: 56 }} />
            <Column
              header="썸네일"
              style={{ width: 90 }}
              body={(r: ProductListItem) => (
                <div className={styles.thumbCell}>
                  <Thumb src={r.thumbnail} alt={r.name} />
                  <small className="muted">{r.code}</small>
                </div>
              )}
            />
            <Column
              field="name"
              header="상품명"
              sortable
              body={(r: ProductListItem) => (
                <Link href={`/shopping/products/${r.id}`} className={styles.nameLink}>
                  {r.name}
                </Link>
              )}
            />
            <Column field="price" header="판매가" sortable body={(r: ProductListItem) => formatWon(r.price)} />
            <Column field="categoryPath" header="카테고리" />
            <Column
              header="노출 상태"
              style={{ width: 130 }}
              body={(r: ProductListItem) =>
                canUpdate ? (
                  <Dropdown
                    value={r.isVisible}
                    options={YES_NO_OPTIONS}
                    aria-label={`${r.name} 노출 상태`}
                    onChange={(e) =>
                      status.mutate(
                        { ids: [r.id], status: e.value },
                        {
                          onSuccess: () => toast.show('success', '저장되었습니다.'),
                          onError: (err) => toast.show('error', errorText(err)),
                        },
                      )
                    }
                  />
                ) : r.isVisible === 'yes' ? (
                  'Yes'
                ) : (
                  'No'
                )
              }
            />
            <Column field="createdAt" header="등록일" sortable body={(r: ProductListItem) => formatDateTime(r.createdAt)} />
          </DataTable>
        )}
      </div>
    </>
  );
}
