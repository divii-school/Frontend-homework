"use client";

import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useEffect, useState, type FormEvent } from "react";
import { SEARCH_TYPE_OPTIONS } from "@/constants/products";
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

  // The box keeps what the user types; the search runs on Enter or a click on the magnifier (design 8.1.0, rule 2),
  // and only then goes to the URL. A change of the URL from outside (Back button, a shared link) refills the box.
  const [searchText, setSearchText] = useState(params.search);
  useEffect(() => setSearchText(params.search), [params.search]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    onChange({ search: searchText.trim() });
  };

  return (
    <div className="list-toolbar">
      <div className="list-toolbar-filters">
        <Dropdown
          className="list-toolbar-type"
          value={params.type}
          options={SEARCH_TYPE_OPTIONS}
          aria-label="검색 기준"
          // With a category filter the API searches by product name only.
          disabled={params.categoryId !== null}
          onChange={(event) => onChange({ type: event.value })}
        />
        <form className="search-box list-toolbar-search" role="search" onSubmit={submitSearch}>
          <InputText
            value={searchText}
            placeholder="검색어 입력"
            aria-label="상품 검색"
            onChange={(event) => setSearchText(event.target.value)}
          />
          <Button type="submit" className="search-box-button" icon="pi pi-search" text aria-label="검색" />
        </form>
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
          emptyMessage={categories.isError ? categories.error.messages[0] : "카테고리가 없습니다."}
          onChange={(event) => onChange({ categoryId: event.value ?? null, type: "productName" })}
        />
      </div>
      <div className="list-toolbar-actions">
        <Button type="button" label="내보내기" icon="pi pi-download" outlined loading={exporting} disabled={exporting || !totalRecords} onClick={onExport} />
        {canDelete && (
          <Button
            type="button"
            className="button-small button-neutral"
            label="삭제"
            outlined
            aria-label={selectedCount > 0 ? `선택한 상품 ${formatCount(selectedCount)}개 삭제` : "삭제"}
            disabled={selectedCount === 0}
            onClick={onDelete}
          />
        )}
        <p className="list-toolbar-count" aria-live="polite">
          총 게시물 : {totalRecords === null ? "-" : formatCount(totalRecords)}
        </p>
      </div>
    </div>
  );
}
