"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/api-services/ProductService.types";
import { formatCategoryPath, formatDateTime, formatWon } from "@/utils/format";
import ProductStatusSelect from "./ProductStatusSelect";
import ProductThumbnail from "./ProductThumbnail";
import { PRODUCT_ROUTES } from "./product-routes";
import type { SortField, SortOrder } from "./list-url-state";

interface ProductTableProps {
  rows: Product[];
  caption: string;
  selected: ReadonlySet<number>;
  selectionFull: boolean;
  onToggleRow: (id: number) => void;
  onTogglePage: () => void;
  sort: SortField | null;
  order: SortOrder;
  onSort: (field: SortField) => void;
  canUpdate: boolean;
  /** Next page / filter is loading while the old rows stay on screen. */
  busy: boolean;
}

// Column header that sorts: a real <button> inside the <th>, aria-sort tells screen readers the state.
function SortableHeader({
  field,
  label,
  sort,
  order,
  onSort,
  className,
}: {
  field: SortField;
  label: string;
  sort: SortField | null;
  order: SortOrder;
  onSort: (field: SortField) => void;
  className: string;
}) {
  const active = sort === field;
  const ariaSort = active ? (order === "asc" ? "ascending" : "descending") : "none";
  const icon = !active ? "pi-sort-alt" : order === "asc" ? "pi-sort-amount-up-alt" : "pi-sort-amount-down";
  return (
    <th scope="col" className={className} aria-sort={ariaSort}>
      <button type="button" className={`product-sort-button${active ? " is-active" : ""}`} onClick={() => onSort(field)}>
        {label}
        <i className={`pi ${icon}`} aria-hidden="true" />
      </button>
    </th>
  );
}

// Product table (design 8.1.0 ⑤–⑪). One markup for every width:
//  - > 1024px  : a normal table like the design
//  - ≤ 1024px  : the same table scrolls sideways inside .table-scroll-box
//  - ≤ 768px   : CSS turns each row into a card (thumbnail left, details right)
export default function ProductTable({
  rows,
  caption,
  selected,
  selectionFull,
  onToggleRow,
  onTogglePage,
  sort,
  order,
  onSort,
  canUpdate,
  busy,
}: ProductTableProps) {
  // Header checkbox: ticked when every row of this page is selected, "partly" when some are
  const headerCheckbox = useRef<HTMLInputElement>(null);
  const selectedOnPage = rows.filter((row) => selected.has(row.id)).length;
  const allOnPage = rows.length > 0 && selectedOnPage === rows.length;

  useEffect(() => {
    if (headerCheckbox.current) headerCheckbox.current.indeterminate = selectedOnPage > 0 && !allOnPage;
  }, [selectedOnPage, allOnPage]);

  return (
    <div className={`table-scroll-box product-table-box${busy ? " is-busy" : ""}`} aria-busy={busy || undefined}>
      <table className="product-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="col-select">
              <input
                ref={headerCheckbox}
                type="checkbox"
                className="product-checkbox"
                aria-label="현재 페이지의 상품 전체 선택"
                checked={allOnPage}
                disabled={rows.length === 0}
                onChange={onTogglePage}
              />
            </th>
            <th scope="col" className="col-thumb">
              썸네일
            </th>
            <SortableHeader field="name" label="상품명" sort={sort} order={order} onSort={onSort} className="col-name" />
            <SortableHeader field="price" label="판매금액" sort={sort} order={order} onSort={onSort} className="col-price" />
            <th scope="col" className="col-category">
              카테고리(과정)
            </th>
            <th scope="col" className="col-status">
              노출여부
            </th>
            <SortableHeader field="date" label="등록일자" sort={sort} order={order} onSort={onSort} className="col-date" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selected.has(row.id);
            const hasDiscount = Number(row.price) > Number(row.unitPrice);
            return (
              <tr key={row.id} className={`product-row${isSelected ? " is-selected" : ""}`}>
                <td className="col-select">
                  <input
                    type="checkbox"
                    className="product-checkbox"
                    aria-label={`${row.productName} 선택`}
                    checked={isSelected}
                    disabled={!isSelected && selectionFull}
                    onChange={() => onToggleRow(row.id)}
                  />
                </td>
                <td className="col-thumb">
                  <ProductThumbnail src={row.image} />
                  <span className="product-code">{row.productCode || "-"}</span>
                </td>
                <td className="col-name">
                  <Link href={PRODUCT_ROUTES.details(row.id)} className="product-name-link">
                    {row.productName}
                  </Link>
                </td>
                <td className="col-price">
                  <span className="product-price">{formatWon(row.unitPrice)}</span>
                  {hasDiscount && (
                    <s className="product-list-price">
                      <span className="sr-only">단가 </span>
                      {formatWon(row.price)}
                    </s>
                  )}
                </td>
                <td className="col-category" data-label="카테고리(과정)">
                  {formatCategoryPath(row.category, row.subCategory, row.childCategory)}
                </td>
                <td className="col-status" data-label="노출여부">
                  <ProductStatusSelect
                    productId={row.id}
                    productName={row.productName}
                    isVisible={row.isVisible}
                    disabled={!canUpdate}
                  />
                </td>
                <td className="col-date" data-label="등록일자">
                  {formatDateTime(row.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
