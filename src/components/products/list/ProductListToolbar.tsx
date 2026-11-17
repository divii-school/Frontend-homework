"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import type { CategoryOption, ProductSearchType, ProductType } from "@/api-services/ProductService.types";
import {
  useGetPickerCategories,
  useGetPickerChildCategories,
  useGetPickerSubCategories,
} from "@/hooks/API/products/useProductPickers";
import { MAX_SEARCH_LENGTH, type ProductListUrlState } from "./list-url-state";

interface ProductListToolbarProps {
  state: ProductListUrlState;
  onChange: (patch: Partial<ProductListUrlState>) => void;
  onReset: () => void;
  canReset: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

const SEARCH_TYPE_OPTIONS: Array<{ value: ProductSearchType; label: string }> = [
  { value: "productName", label: "상품명" },
  { value: "categoryName", label: "카테고리" },
];

const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { value: "MAIN", label: "메인 상품" },
  { value: "SUPPLEMENTARY", label: "단권 상품" },
];

const toOptions = (items: CategoryOption[] | undefined): SelectOption[] =>
  (items ?? []).map((item) => ({ value: String(item.id), label: item.name }));

const toId = (value: string): number | null => (value ? Number(value) : null);

// One labelled native <select> of the filter row ("All" = no filter). Native selects are
// keyboard- and screen-reader-friendly by default and open the phone's own picker.
function FilterSelect({
  id,
  label,
  value,
  options,
  onChange,
  disabled = false,
  loading = false,
  failed = false,
}: {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  failed?: boolean;
}) {
  const allLabel = loading ? "불러오는 중…" : failed ? "불러오기 실패" : "전체";
  return (
    <div className="product-filter">
      <label htmlFor={id} className="product-filter-label">
        {label}
      </label>
      <span className="product-select">
        <select id={id} value={value} disabled={disabled} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}>
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <i className="pi pi-chevron-down product-select-icon" aria-hidden="true" />
      </span>
    </div>
  );
}

// Search row (design 8.1.0 ②: search type + term, Enter or the magnifier) and the filter row
// (cascading Major → Medium → Minor category + product type). Every change goes straight to the
// URL through onChange; only the text box keeps a draft until it is submitted.
export default function ProductListToolbar({ state, onChange, onReset, canReset }: ProductListToolbarProps) {
  const [draft, setDraft] = useState(state.q);

  // The URL wins: reset / back / a shared link put their term back into the box
  useEffect(() => {
    setDraft(state.q);
  }, [state.q]);

  const categories = useGetPickerCategories();
  const subCategories = useGetPickerSubCategories(state.categoryId);
  const childCategories = useGetPickerChildCategories(state.subCategoryId);

  // List B (search by category name) takes no category / type filters — the API would ignore them
  const filtersOff = state.searchType === "categoryName";

  return (
    <div className="product-list-toolbar">
      {/* Search: type + term, submitted with Enter or the magnifier */}
      <form
        className="product-search"
        role="search"
        aria-label="상품 검색"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ q: draft.trim() });
        }}
      >
        <label htmlFor="product-search-type" className="sr-only">
          검색 조건
        </label>
        <span className="product-select product-search-type">
          <select
            id="product-search-type"
            value={state.searchType}
            onChange={(event) => {
              const searchType = event.target.value as ProductSearchType;
              // A category-name search drops the filters it can't use
              onChange(
                searchType === "categoryName"
                  ? { searchType, categoryId: null, subCategoryId: null, childCategoryId: null, productType: null }
                  : { searchType },
              );
            }}
          >
            {SEARCH_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <i className="pi pi-chevron-down product-select-icon" aria-hidden="true" />
        </span>
        <span className="product-search-field">
          <label htmlFor="product-search-input" className="sr-only">
            검색어
          </label>
          <InputText
            id="product-search-input"
            type="search"
            value={draft}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="검색어 입력"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" icon="pi pi-search" text aria-label="검색" className="product-search-button" />
        </span>
      </form>

      {/* Filters: Major → Medium → Minor category (each needs the one before) + product type */}
      <div className="product-filters" role="group" aria-label="필터">
        <FilterSelect
          id="product-filter-category"
          label="대분류"
          value={state.categoryId ? String(state.categoryId) : ""}
          options={toOptions(categories.data)}
          loading={categories.isPending}
          failed={categories.isError}
          disabled={filtersOff}
          onChange={(value) => onChange({ categoryId: toId(value), subCategoryId: null, childCategoryId: null })}
        />
        <FilterSelect
          id="product-filter-subcategory"
          label="중분류"
          value={state.subCategoryId ? String(state.subCategoryId) : ""}
          options={toOptions(subCategories.data)}
          loading={state.categoryId !== null && subCategories.isPending}
          failed={subCategories.isError}
          disabled={filtersOff || state.categoryId === null}
          onChange={(value) => onChange({ subCategoryId: toId(value), childCategoryId: null })}
        />
        <FilterSelect
          id="product-filter-childcategory"
          label="소분류"
          value={state.childCategoryId ? String(state.childCategoryId) : ""}
          options={toOptions(childCategories.data)}
          loading={state.subCategoryId !== null && childCategories.isPending}
          failed={childCategories.isError}
          disabled={filtersOff || state.subCategoryId === null}
          onChange={(value) => onChange({ childCategoryId: toId(value) })}
        />
        <FilterSelect
          id="product-filter-type"
          label="상품 유형"
          value={state.productType ?? ""}
          options={PRODUCT_TYPE_OPTIONS}
          disabled={filtersOff}
          onChange={(value) => onChange({ productType: (value || null) as ProductType | null })}
        />
        <Button
          type="button"
          label="필터 초기화"
          icon="pi pi-filter-slash"
          text
          className="product-filters-reset"
          disabled={!canReset}
          onClick={onReset}
        />
      </div>
      {filtersOff && (
        <p className="field-hint product-filters-hint">카테고리 검색은 대분류·중분류·소분류 전체를 대상으로 하므로 필터를 사용할 수 없습니다.</p>
      )}
    </div>
  );
}
