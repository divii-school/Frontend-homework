"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeading } from "@/components/common/PageHeading";
import { Pagination } from "@/components/common/Pagination";
import { ErrorState, StateBlock } from "@/components/common/StateBlock";
import { ProductsTable, categoryPath } from "@/components/products/ProductsTable";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { NAV_GROUP_LABEL, canDo } from "@/config/navigation";
import { ROUTES } from "@/constants/routes";
import { useGetProductsList } from "@/hooks/API/products/useGetProductsList";
import { useDeleteProducts, useExportProducts, useSetProductVisible } from "@/hooks/API/products/useProductMutations";
import { useProductListParams } from "@/hooks/useProductListParams";
import type { ApiError } from "@/types/api";
import type { Product } from "@/types/product";
import { downloadCsv, toCsv } from "@/utils/csv";
import { formatCount, formatDateTime, formatWon } from "@/utils/format";

const EXPORT_HEADER = ["상품코드", "상품명", "판매금액", "카테고리", "노출여부", "판매상태", "등록일자"];

/**
 * Product list screen. Where the state lives:
 * - filters, sort, page  -> the URL (useProductListParams);
 * - rows                 -> the TanStack Query cache (useGetProductsList);
 * - selected rows, the delete dialog -> useState here, because they belong to this screen only.
 */
export function ProductsList() {
  const { user } = useAuth();
  const showToast = useToast();
  const { params, update } = useProductListParams();
  const list = useGetProductsList(params);
  const deleteProducts = useDeleteProducts();
  const setVisible = useSetProductVisible();
  const exportProducts = useExportProducts();
  const [selected, setSelected] = useState<Product[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Rows whose visibility is being saved. Each switch keeps its own state and gets its own error toast.
  const [savingIds, setSavingIds] = useState<ReadonlySet<number>>(new Set());

  const canWrite = canDo(user, "product.write");
  const canDelete = canDo(user, "product.delete");

  // A selection belongs to the rows on screen: a new page or filter starts with nothing selected.
  useEffect(() => setSelected([]), [params]);

  // A page past the end (a hand-typed URL, or the last row of the last page was deleted) has no rows although
  // the filter has results: go to the last page that exists.
  const pastTheEnd = list.isSuccess && !list.isPlaceholderData && list.data.items.length === 0 && list.data.totalRecords > 0;
  const lastPage = list.data?.totalPages ?? 1;
  useEffect(() => {
    if (pastTheEnd && params.page > lastPage) update({ page: Math.max(1, lastPage) }, "replace");
  }, [pastTheEnd, lastPage, params.page, update]);

  const handleDelete = () => {
    deleteProducts.mutate(
      selected.map((product) => product.id),
      {
        onSuccess: () => {
          showToast({ severity: "success", summary: "삭제 완료", detail: `상품 ${formatCount(selected.length)}개를 삭제했습니다.` });
          setSelected([]);
          setConfirmOpen(false);
        },
      },
    );
  };

  const handleToggleVisible = (product: Product) => {
    setSavingIds((current) => new Set(current).add(product.id));
    setVisible
      .mutateAsync({ id: product.id, visible: !product.isVisible })
      // Design 8.1.0: the change is saved at once and a toast confirms it.
      .then(() =>
        showToast({ severity: "success", summary: "저장 완료", detail: `${product.productName}: 노출여부를 변경했습니다.` }),
      )
      .catch((error: ApiError) =>
        showToast({ severity: "error", summary: "저장 실패", detail: `${product.productName}: ${error.messages[0]}` }),
      )
      .finally(() =>
        setSavingIds((current) => {
          const next = new Set(current);
          next.delete(product.id);
          return next;
        }),
      );
  };

  const handleExport = () => {
    exportProducts.mutate(params, {
      onSuccess: (rows) => {
        const body = rows.map((product) => [
          product.productCode,
          product.productName,
          formatWon(product.price),
          categoryPath(product),
          product.isVisible ? "예" : "아니오",
          product.onSale ? "예" : "아니오",
          formatDateTime(product.createdAt),
        ]);
        downloadCsv("products.csv", toCsv([EXPORT_HEADER, ...body]));
        showToast({ severity: "success", summary: "내보내기 완료", detail: `상품 ${formatCount(rows.length)}개를 내보냈습니다.` });
      },
      onError: (error) => showToast({ severity: "error", summary: "내보내기 실패", detail: error.messages[0] }),
    });
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    deleteProducts.reset();
  };

  return (
    <>
      <PageHeading
        title="상품 관리"
        breadcrumb={[NAV_GROUP_LABEL, "상품 관리"]}
        actions={
          canWrite && (
            <Link className="link-button link-button-primary" href={ROUTES.productCreate}>
              등록
            </Link>
          )
        }
      />
      <section className="panel" aria-label="상품 목록">
        <ProductsToolbar
          params={params}
          totalRecords={list.data?.totalRecords ?? null}
          selectedCount={selected.length}
          canDelete={canDelete}
          exporting={exportProducts.isPending}
          onChange={update}
          onDelete={() => setConfirmOpen(true)}
          onExport={handleExport}
        />
        {list.isPending ? (
          <StateBlock kind="loading" title="상품을 불러오는 중입니다." />
        ) : list.isError ? (
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        ) : list.data.items.length === 0 ? (
          params.search || params.categoryId !== null ? (
            // Design 8.1.0, rule 2: a search without a result says "검색 결과가 없습니다".
            <StateBlock kind="empty" title="검색 결과가 없습니다." description="검색어나 필터를 바꿔 다시 찾아보세요." />
          ) : (
            <StateBlock kind="empty" title="등록된 상품이 없습니다." />
          )
        ) : (
          <>
            <ProductsTable
              products={list.data.items}
              params={params}
              selected={selected}
              selectable={canDelete}
              editable={canWrite}
              savingIds={savingIds}
              onSelect={setSelected}
              onSort={(sort, order) => update({ sort, order, page: params.page })}
              onToggleVisible={handleToggleVisible}
            />
            <Pagination
              page={params.page}
              limit={params.limit}
              totalRecords={list.data.totalRecords}
              onChange={(page, limit) => update({ page, limit })}
            />
          </>
        )}
      </section>
      <ConfirmDialog
        visible={confirmOpen}
        title="상품 삭제"
        confirmLabel="삭제"
        pending={deleteProducts.isPending}
        error={deleteProducts.error}
        onConfirm={handleDelete}
        onCancel={closeConfirm}
      >
        <p>선택한 상품 {formatCount(selected.length)}개를 삭제하시겠습니까? 삭제한 상품은 되돌릴 수 없습니다.</p>
        <ul className="confirm-dialog-list">
          {selected.map((product) => (
            <li key={product.id}>{product.productName}</li>
          ))}
        </ul>
      </ConfirmDialog>
    </>
  );
}
