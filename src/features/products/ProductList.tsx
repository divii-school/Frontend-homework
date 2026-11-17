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
      else notify("error", `You can select up to ${PRODUCT_SELECTION_MAX} products at once.`);
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
            notify("error", `You can select up to ${PRODUCT_SELECTION_MAX} products at once.`);
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
      notify("success", `“${row.productName}” is now ${visible ? "shown" : "hidden"}.`);
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
        ["ID", "Product code", "Product name", "Selling price", "Category", "Exposure", "Registration date"],
        all.map((p) => [
          p.id,
          p.productCode,
          p.productName,
          p.price,
          formatCategoryPath([p.category, p.subCategory, p.childCategory]),
          p.isVisible ? "Yes" : "No",
          formatDateTime(p.createdAt),
        ]),
      );
      notify("success", `Exported ${all.length.toLocaleString("en-US")} products.`);
    } catch (error) {
      notify("error", errorMessage(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Product Management"
        actions={
          <Link href="/shopping/products/new" className={`${btn.button} ${btn.primary} ${styles.register}`}>
            Register
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
                  {selected.size} selected
                  <button type="button" className={styles.clear} onClick={() => setSelected(new Set())}>
                    Clear
                  </button>
                </span>
              )}
              <button
                type="button"
                className={styles["small-button"]}
                onClick={() => setConfirmDelete(true)}
                disabled={selected.size === 0}
              >
                Delete
              </button>
              <button
                type="button"
                className={styles["small-button"]}
                onClick={exportCsv}
                disabled={exporting || total === 0}
                aria-busy={exporting}
              >
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              <span className={styles.total} aria-live="polite">
                Total Posts: {query.data ? total.toLocaleString("en-US") : "–"}
              </span>
            </div>
          </div>

          <div className={styles["table-wrap"]} aria-busy={query.isFetching}>
            <table className={styles.table}>
              <caption className="visually-hidden">
                Products, page {params.page} of {totalPages}
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
                      aria-label="Select all products on this page"
                    />
                  </th>
                  <th scope="col" className={styles["col-thumb"]}>
                    Thumbnail
                  </th>
                  <th scope="col">Product Name</th>
                  <th scope="col" className={styles["col-price"]}>
                    Selling Price
                  </th>
                  <th scope="col">Category (Course)</th>
                  <th scope="col" className={styles["col-status"]}>
                    Exposure Status
                  </th>
                  <th scope="col" className={styles["col-date"]}>
                    Registration Date
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
                        Try again
                      </button>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.message} role="status">
                      <p>{params.search ? "No search results found." : "No products yet."}</p>
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
                          aria-label={`Select ${row.productName}`}
                        />
                      </td>
                      <td>
                        <div className={styles.thumb}>
                          {row.image ? (
                            <Image src={row.image} alt="" fill sizes="64px" className={styles["thumb-img"]} />
                          ) : (
                            <span className="visually-hidden">No image</span>
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
                          aria-label={`Exposure status of ${row.productName}`}
                        >
                          <option value="yes">Yes</option>
                          <option value="no">No</option>
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
