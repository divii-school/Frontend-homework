"use client";

import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useEffect, useState } from "react";
import { SEARCH_DEBOUNCE_MS, SEARCH_TYPE_OPTIONS } from "@/constants/products";
import { useCategoryOptions } from "@/hooks/API/categories/useCategories";
import type { ProductListParams } from "@/types/product";
import { formatCount } from "@/utils/format";

interface ProductsToolbarProps {
  params: ProductListParams;
  totalRecords: number | null;
  selectedCount: number;
  canDelete: boolean;
  exporting: boolean;
  onChange: (changes: Partial<ProductListParams>, mode?: "push" | "replace") => void;
  onDelete: () => void;
  onExport: () => void;
}

/** Search, filters and the bulk actions above the product table. It owns no list state: everything goes to the URL through onChange. */
export function ProductsToolbar(props: ProductsToolbarProps) {
  const { params, totalRecords, selectedCount, canDelete, exporting, onChange, onDelete, onExport } = props;
  const categories = useCategoryOptions("category", null);

  // The box shows what the user types at once; the URL (and so the API call) follows after a short pause.
  const [searchText, setSearchText] = useState(params.search);
  useEffect(() => setSearchText(params.search), [params.search]);
  useEffect(() => {
    if (searchText.trim() === params.search) return;
    const timer = window.setTimeout(() => onChange({ search: searchText.trim() }, "replace"), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchText, params.search, onChange]);

  return (
    <div className="list-toolbar">
      <div className="list-toolbar-filters" role="search">
        <Dropdown
          className="list-toolbar-type"
          value={params.type}
          options={SEARCH_TYPE_OPTIONS}
          aria-label="검색 기준"
          // With a category filter the API searches by product name only.
          disabled={params.categoryId !== null}
          onChange={(event) => onChange({ type: event.value })}
        />
        <span className="p-input-icon-left list-toolbar-search">
          <i className="pi pi-search" aria-hidden="true" />
          <InputText
            value={searchText}
            placeholder="검색어 입력"
            aria-label="상품 검색"
            onChange={(event) => setSearchText(event.target.value)}
          />
        </span>
        <Dropdown
          className="list-toolbar-category"
          value={params.categoryId}
          options={categories.data ?? []}
          optionLabel="name"
          optionValue="id"
          placeholder="전체 카테고리"
          aria-label="카테고리 필터"
          showClear
          loading={categories.isLoading}
          emptyMessage="카테고리가 없습니다."
          onChange={(event) => onChange({ categoryId: event.value ?? null, type: "productName" })}
        />
      </div>
      <div className="list-toolbar-actions">
        <p className="list-toolbar-count" aria-live="polite">
          총 게시물: <strong>{totalRecords === null ? "-" : formatCount(totalRecords)}</strong>
        </p>
        <Button type="button" label="내보내기" icon="pi pi-download" outlined loading={exporting} disabled={exporting || !totalRecords} onClick={onExport} />
        {canDelete && (
          <Button
            type="button"
            label={selectedCount > 0 ? `삭제 (${formatCount(selectedCount)})` : "삭제"}
            icon="pi pi-trash"
            severity="danger"
            disabled={selectedCount === 0}
            onClick={onDelete}
          />
        )}
      </div>
    </div>
  );
}
