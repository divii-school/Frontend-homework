"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { useProducts, useSetProductVisible } from "@/hooks/useProducts";
import { useToast } from "@/providers/ToastProvider";
import { errorMessage } from "@/lib/errors";
import { formatCategoryPath, formatDateTime, formatWon } from "@/lib/format";
import { productService } from "@/services/products";
import { downloadCsv } from "@/lib/csv";
import { PRODUCT_PAGE_SIZE, PRODUCT_SELECTION_MAX, type ProductListItem, type ProductListParams } from "@/types/product";
import btn from "@/components/ui/Button.module.scss";
import { IconEmpty } from "@/components/icons";
import { useProductListParams } from "./useProductListParams";
import { DeleteProductsDialog } from "./DeleteProductsDialog";
import { ProductSearch } from "./ProductSearch";
import styles from "./ProductList.module.scss";

/** Figma 8.1.0 Product Management list. */
export function ProductList() {
  const { params, update } = useProductListParams();
  const query = useProducts(params);
  const setVisible = useSetProductVisible(params);
  const { notify } = useToast();

  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const rows = query.data?.rows ?? [];
  const total = query.data?.totalRecords ?? 0;
  const totalPages = query.data?.totalPage ?? 1;

  // A page past the end (e.g. after deleting the last rows) → go to the last page.
  useEffect(() => {
    if (query.data && params.page > 1 && params.page > query.data.totalPage) update({ page: Math.max(query.data.totalPage, 1) });
  }, [query.data, params.page, update]);

  function search(type: ProductListParams["type"], term: string) {
    setSelected(new Set());
    update({ search: term, type, page: 1 });
  }

  const pageIds = rows.map((row) => row.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPageSelected = pageIds.some((id) => selected.has(id));

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < PRODUCT_SELECTION_MAX) next.add(id);
      else notify("error", `상품은 한 번에 최대 ${PRODUCT_SELECTION_MAX}개까지 선택할 수 있습니다.`);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else {
        for (const id of pageIds) {
          if (next.size >= PRODUCT_SELECTION_MAX) {
            notify("error", `상품은 한 번에 최대 ${PRODUCT_SELECTION_MAX}개까지 선택할 수 있습니다.`);
            break;
          }
          next.add(id);
        }
      }
      return next;
    });
  }

  async function changeVisible(row: ProductListItem, visible: boolean) {
    try {
      await setVisible.mutateAsync({ id: row.id, visible });
      notify("success", `“${row.productName}” 노출여부를 ${visible ? "예" : "아니오"}로 변경했습니다.`);
    } catch (error) {
      notify("error", errorMessage(error));
    }
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const all = await productService.listAll(params, total);
      downloadCsv(
        `products-${new Date().toISOString().slice(0, 10)}.csv`,
        ["ID", "상품코드", "상품명", "판매금액", "카테고리(과정)", "노출여부", "등록일자"],
        all.map((p) => [
          p.id,
          p.productCode,
          p.productName,
          p.price,
          formatCategoryPath([p.category, p.subCategory, p.childCategory]),
          p.isVisible ? "예" : "아니오",
          formatDateTime(p.createdAt),
        ]),
      );
      notify("success", `상품 ${all.length.toLocaleString("ko-KR")}개를 내보냈습니다.`);
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="상품 관리"
        actions={
          <Link href="/shopping/products/new" className={`${btn.button} ${btn.primary} ${styles.register}`}>
            등록
          </Link>
        }
      />

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <ProductSearch
              key={`${params.type}|${params.search}`}
              initialType={params.type}
              initialSearch={params.search}
              onSearch={search}
            />

            <div className={styles.tools}>
              {selected.size > 0 && (
                <span className={styles["selected-count"]} aria-live="polite">
                  {selected.size}개 선택됨
                  <button type="button" className={styles.clear} onClick={() => setSelected(new Set())}>
                    선택 해제
                  </button>
                </span>
              )}
              <button
                type="button"
                className={styles["small-button"]}
                onClick={() => setConfirmDelete(true)}
                disabled={selected.size === 0}
              >
                삭제
              </button>
              <button
                type="button"
                className={styles["small-button"]}
                onClick={exportCsv}
                disabled={exporting || total === 0}
                aria-busy={exporting}
              >
                {exporting ? "내보내는 중…" : "CSV 내보내기"}
              </button>
              <span className={styles.total} aria-live="polite">
                총 게시물 : {query.data ? total.toLocaleString("ko-KR") : "–"}
              </span>
            </div>
          </div>

          <div className={styles["table-wrap"]} aria-busy={query.isFetching}>
            <table className={styles.table}>
              <caption className="visually-hidden">
                상품 목록, {totalPages}페이지 중 {params.page}페이지
              </caption>
              <thead>
                <tr>
                  <th scope="col" className={styles["col-select"]}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={allOnPageSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = !allOnPageSelected && someOnPageSelected;
                      }}
                      onChange={togglePage}
                      disabled={rows.length === 0}
                      aria-label="이 페이지의 상품 전체 선택"
                    />
                  </th>
                  <th scope="col" className={styles["col-thumb"]}>
                    썸네일
                  </th>
                  <th scope="col">상품명</th>
                  <th scope="col" className={styles["col-price"]}>
                    판매금액
                  </th>
                  <th scope="col">카테고리(과정)</th>
                  <th scope="col" className={styles["col-status"]}>
                    노출여부
                  </th>
                  <th scope="col" className={styles["col-date"]}>
                    등록일자
                  </th>
                </tr>
              </thead>
              <tbody>
                {query.isPending ? (
                  Array.from({ length: PRODUCT_PAGE_SIZE }, (_, i) => (
                    <tr key={i} aria-hidden className={styles["skeleton-row"]}>
                      <td colSpan={7}>
                        <span />
                      </td>
                    </tr>
                  ))
                ) : query.isError ? (
                  <tr>
                    <td colSpan={7} className={styles.message} role="alert">
                      <p>{errorMessage(query.error)}</p>
                      <button type="button" className={`${btn.button} ${btn.outline}`} onClick={() => query.refetch()}>
                        다시 시도
                      </button>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.message} role="status">
                      <IconEmpty className={styles["empty-icon"]} />
                      <p>
                        {query.data?.hiddenDeleted
                          ? "이 페이지에는 삭제된 상품만 있어 표시할 상품이 없습니다. 다른 페이지를 확인해 주세요."
                          : params.search
                            ? "검색 결과가 없습니다."
                            : "등록된 상품이 없습니다."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className={selected.has(row.id) ? styles["row-selected"] : undefined}>
                      <td>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label={`${row.productName} 선택`}
                        />
                      </td>
                      <td>
                        <div className={styles.thumb}>
                          {row.image ? (
                            <Image src={row.image} alt="" fill sizes="64px" className={styles["thumb-img"]} />
                          ) : (
                            <span className="visually-hidden">이미지 없음</span>
                          )}
                        </div>
                        <span className={styles.code}>{row.productCode || "-"}</span>
                      </td>
                      <td>
                        <Link href={`/shopping/products/${row.id}`} className={styles.name}>
                          {row.productName}
                        </Link>
                      </td>
                      <td className={styles.price}>{formatWon(row.price)}</td>
                      <td className={styles.category}>{formatCategoryPath([row.category, row.subCategory, row.childCategory])}</td>
                      <td>
                        <select
                          className={styles.status}
                          value={row.isVisible ? "yes" : "no"}
                          onChange={(e) => changeVisible(row, e.target.value === "yes")}
                          aria-label={`${row.productName} 노출여부`}
                        >
                          <option value="yes">예</option>
                          <option value="no">아니오</option>
                        </select>
                      </td>
                      <td className={styles.date}>
                        <time dateTime={row.createdAt}>{formatDateTime(row.createdAt)}</time>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={params.page} totalPages={totalPages} onChange={(page) => update({ page })} />
        </div>
      </div>

      {confirmDelete && (
        <DeleteProductsDialog
          ids={[...selected]}
          onClose={() => setConfirmDelete(false)}
          onDeleted={() => setSelected(new Set())}
        />
      )}
    </>
  );
}
