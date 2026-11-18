"use client";

import Link from "next/link";
import { Column } from "primereact/column";
import { DataTable, type DataTableSelectionMultipleChangeEvent, type DataTableSortEvent } from "primereact/datatable";
import { Dropdown } from "primereact/dropdown";
import { ProductThumbnail } from "@/components/products/ProductThumbnail";
import { THUMBNAIL_SIZE } from "@/constants/design";
import { YES_NO_OPTIONS } from "@/constants/products";
import { ROUTES } from "@/constants/routes";
import type { Product, ProductListParams, ProductSortField } from "@/types/product";
import { formatDateTime, formatWon } from "@/utils/format";

interface ProductsTableProps {
  products: Product[];
  params: ProductListParams;
  selected: Product[];
  /** False for roles that may not delete: the checkbox column is not drawn. */
  selectable: boolean;
  /** False for read-only roles: the 노출여부 dropdown is disabled. */
  editable: boolean;
  /** Rows whose visibility is being saved: their dropdowns wait for the answer. */
  savingIds: ReadonlySet<number>;
  onSelect: (products: Product[]) => void;
  onSort: (sort: ProductSortField, order: "asc" | "desc") => void;
  onToggleVisible: (product: Product) => void;
}

/** "대분류 > 중분류 > 소분류", skipping a level the product does not have. */
export const categoryPath = (product: Product): string =>
  [product.category, product.subCategory, product.childCategory]
    .filter((level) => level !== null)
    .map((level) => level.name)
    .join(" > ") || "-";

/**
 * The product table. `lazy` tells PrimeReact not to sort or page the rows itself: the rows it gets are already
 * the right page in the right order, and a click on a header only reports the new sort to the parent (-> URL).
 */
export function ProductsTable(props: ProductsTableProps) {
  const { products, params, selected, selectable, editable, savingIds, onSelect, onSort, onToggleVisible } = props;

  const handleSort = (event: DataTableSortEvent) => {
    onSort(event.sortField as ProductSortField, event.sortOrder === 1 ? "asc" : "desc");
  };

  return (
    <>
      {/* The products API has no sort parameter (A1), so a sort orders only the rows of this page: say so. */}
      <p className="list-hint" id="products-sort-hint">
        정렬은 현재 페이지 기준입니다.
      </p>
      <div className="table-scroll">
        <DataTable
          className="data-table"
          value={products}
          dataKey="id"
          lazy
          sortField={params.sort}
          sortOrder={params.order === "asc" ? 1 : -1}
          onSort={handleSort}
          selectionMode={selectable ? "checkbox" : null}
          selection={selected}
          onSelectionChange={(event: DataTableSelectionMultipleChangeEvent<Product[]>) => onSelect(event.value)}
          aria-label="상품 목록"
          aria-describedby="products-sort-hint"
          // Design 8.1.0: the first header cell is the word 선택, with no select-all box.
          showSelectAll={false}
        >
          {selectable && <Column selectionMode="multiple" header="선택" headerClassName="data-table-check" />}
          <Column
            header="썸네일"
            body={(product: Product) => (
              // Design 8.1.0: the product code under the thumbnail
              <span className="product-thumbnail-cell">
                <ProductThumbnail src={product.image} alt="" size={THUMBNAIL_SIZE} />
                <span className="product-thumbnail-code">{product.productCode}</span>
              </span>
            )}
          />
          <Column
            field="productName"
            header="상품명"
            sortable
            body={(product: Product) => (
              <Link className="data-table-link" href={ROUTES.productDetails(product.id)}>
                {product.productName}
              </Link>
            )}
          />
          <Column field="price" header="판매금액" sortable bodyClassName="data-table-nowrap" body={(product: Product) => formatWon(product.price)} />
          <Column header="카테고리(과정)" body={categoryPath} />
          <Column
            header="노출여부"
            body={(product: Product) => (
              // Design 8.1.0: an inline 예 / 아니오 dropdown, saved at once with a toast (design review of 18 Nov)
              <Dropdown
                className="visibility-select"
                value={product.isVisible}
                options={YES_NO_OPTIONS}
                disabled={!editable || savingIds.has(product.id)}
                aria-label={`${product.productName} 노출여부`}
                onChange={(event) => {
                  if (event.value !== product.isVisible) onToggleVisible(product);
                }}
              />
            )}
          />
          <Column field="createdAt" header="등록일자" sortable bodyClassName="data-table-nowrap" body={(product: Product) => formatDateTime(product.createdAt)} />
        </DataTable>
      </div>
    </>
  );
}
