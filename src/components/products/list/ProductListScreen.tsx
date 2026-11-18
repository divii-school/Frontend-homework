"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "primereact/button";
import { ListPagination, PageHeader, StateWrapper, TableSkeleton } from "@/components";
import { getBreadcrumb, ROUTE_KEYS } from "@/config/navigation";
import { useCan } from "@/hooks/useCan";
import { useGetProductList } from "@/hooks/API/products/useGetProductList";
import { useDeleteProducts } from "@/hooks/API/products/useProductMutations";
import { useToast } from "@/providers/ToastProvider";
import { getApiMessage } from "@/utils/api-messages";
import { confirmDelete } from "@/utils/confirm";
import { PAGE_SIZE_OPTIONS } from "@/utils/constants";
import { formatNumber } from "@/utils/format";
import ExportCsvButton from "./ExportCsvButton";
import ProductListToolbar from "./ProductListToolbar";
import ProductTable from "./ProductTable";
import { hasActiveFilters, nextSort, sortProducts, toApiQuery, type SortField } from "./list-url-state";
import { PRODUCT_ROUTES } from "./product-routes";
import { useProductListUrlState } from "./useProductListUrlState";
import { useProductSelection } from "./useProductSelection";

// 8.1.0 Product Management list.
// Data flow: URL → state (useProductListUrlState) → API query (toApiQuery) → useGetProductList → table.
// Every control writes back to the URL, never to local state, so the URL is the single source of truth.
export default function ProductListScreen() {
  const toast = useToast();
  const { state, update, reset } = useProductListUrlState();
  const apiQuery = useMemo(() => toApiQuery(state), [state]);
  const list = useGetProductList(apiQuery);
  const selection = useProductSelection();
  const deleteProducts = useDeleteProducts();

  const canCreate = useCan(ROUTE_KEYS.PRODUCTS, "create");
  const canUpdate = useCan(ROUTE_KEYS.PRODUCTS, "update");
  const canDelete = useCan(ROUTE_KEYS.PRODUCTS, "delete");

  // The API can't sort, so the rows of this page are sorted here (design question 6)
  const rows = useMemo(() => sortProducts(list.data?.items ?? [], state.sort, state.order), [list.data, state.sort, state.order]);
  const totalRecords = list.data?.totalRecords ?? 0;
  const filtersActive = hasActiveFilters(state);

  // A page past the end (an old link, or the last rows were just deleted) → go to the last page
  const totalPage = list.data?.totalPage ?? 0;
  useEffect(() => {
    if (!list.isPlaceholderData && totalPage > 0 && state.page > totalPage) update({ page: totalPage });
  }, [list.isPlaceholderData, totalPage, state.page, update]);

  // Header checkbox → select / unselect this page (max 100 overall)
  const handleTogglePage = () => {
    const skipped = selection.togglePage(rows.map((row) => row.id));
    if (skipped > 0) {
      toast.warn("선택 제한", `한번에 최대 ${selection.max}건까지 선택 가능합니다. ${formatNumber(skipped)}건은 선택되지 않았습니다.`);
    }
  };

  // Bulk delete: confirm (it affects every admin), delete, toast, clear the selection; the hook refetches
  const handleDelete = async () => {
    const ids = [...selection.selected];
    if (ids.length === 0) return;
    const confirmed = await confirmDelete(
      `선택한 상품 ${formatNumber(ids.length)}건을 삭제하시겠습니까? 삭제한 상품은 모든 관리자 화면에서 삭제되며 되돌릴 수 없습니다.`,
      "상품 삭제",
    );
    if (!confirmed) return;
    deleteProducts.mutate(ids, {
      onSuccess: (res) => {
        toast.success(getApiMessage(res.message), `${formatNumber(ids.length)}건 삭제 완료`);
        selection.clear();
      },
      onError: (error) => toast.error("삭제에 실패했습니다.", error.message),
    });
  };

  const handleSort = (field: SortField) => update({ ...nextSort(state, field), page: state.page });

  return (
    <>
      <PageHeader
        title="상품 관리"
        breadcrumb={getBreadcrumb(ROUTE_KEYS.PRODUCTS)}
        actions={
          canCreate && (
            <Link href={PRODUCT_ROUTES.create} className="p-button p-component">
              등록
            </Link>
          )
        }
      />

      <section className="content-card product-list" aria-label="상품 목록">
        {/* Search + filters (all of them live in the URL) */}
        <ProductListToolbar state={state} onChange={update} onReset={reset} canReset={filtersActive} />

        {/* Summary row: total, page size, export, bulk delete (design ③ ④) */}
        <div className="product-list-summary">
          <p className="product-list-total">
            총 게시물 : <strong>{list.data ? formatNumber(totalRecords) : "-"}</strong>
          </p>
          <div className="product-page-size">
            <label htmlFor="product-page-size">페이지당 행 수</label>
            <span className="product-select">
              <select id="product-page-size" value={state.limit} onChange={(event) => update({ limit: Number(event.target.value) })}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <i className="pi pi-chevron-down product-select-icon" aria-hidden="true" />
            </span>
          </div>
          <div className="product-list-actions">
            <ExportCsvButton query={apiQuery} sort={state.sort} order={state.order} totalRecords={totalRecords} />
            {canDelete && (
              <Button
                type="button"
                label="삭제"
                icon="pi pi-trash"
                outlined
                severity="danger"
                disabled={selection.count === 0 || deleteProducts.isPending}
                loading={deleteProducts.isPending}
                onClick={handleDelete}
              />
            )}
          </div>
        </div>

        {/* Selection bar: always in the DOM so screen readers hear the count change */}
        <div className="product-selection-bar" role="status" data-empty={selection.count === 0 || undefined}>
          {selection.count > 0 && (
            <>
              <span>
                <strong>{formatNumber(selection.count)}</strong>건 선택됨
                {selection.isFull && ` (최대 ${selection.max}건)`}
              </span>
              <span aria-hidden="true">·</span>
              <Button type="button" label="선택 해제" text className="product-selection-clear" onClick={selection.clear} />
            </>
          )}
        </div>

        {state.sort && (
          <p className="product-sort-note">
            <i className="pi pi-info-circle" aria-hidden="true" /> 현재 페이지 안에서만 정렬됩니다. (기본 순서: 최신 등록순)
          </p>
        )}

        {/* Table with its loading / error / empty states */}
        <StateWrapper
          isLoading={list.isPending}
          isError={list.isError}
          error={list.error}
          onRetry={() => void list.refetch()}
          isEmpty={rows.length === 0}
          loadingFallback={<TableSkeleton rows={6} columns={7} label="상품 목록을 불러오는 중…" />}
          emptyTitle={filtersActive ? "검색 결과가 없습니다" : "등록된 상품이 없습니다"}
          emptyDescription={filtersActive ? "검색어 또는 필터 조건을 변경해 주세요." : "상품을 등록하면 이 목록에 표시됩니다."}
          emptyAction={
            filtersActive ? (
              <Button type="button" label="필터 초기화" icon="pi pi-filter-slash" outlined onClick={reset} />
            ) : canCreate ? (
              <Link href={PRODUCT_ROUTES.create} className="p-button p-component">
                상품 등록
              </Link>
            ) : undefined
          }
        >
          <ProductTable
            rows={rows}
            caption={totalPage ? `상품 목록, 전체 ${totalPage}페이지 중 ${state.page}페이지` : `상품 목록, ${state.page}페이지`}
            selected={selection.selected}
            selectionFull={selection.isFull}
            onToggleRow={selection.toggle}
            onTogglePage={handleTogglePage}
            sort={state.sort}
            order={state.order}
            onSort={handleSort}
            canUpdate={canUpdate}
            busy={list.isFetching && list.isPlaceholderData}
          />
        </StateWrapper>

        {!list.isError && (
          <ListPagination
            page={state.page}
            limit={state.limit}
            totalRecords={totalRecords}
            onChange={({ page }) => update({ page })}
          />
        )}
      </section>
    </>
  );
}
