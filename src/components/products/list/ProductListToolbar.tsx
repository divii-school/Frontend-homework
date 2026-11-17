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
  { value: "productName", label: "Product name" },
  { value: "categoryName", label: "Category" },
];

const PRODUCT_TYPE_OPTIONS: SelectOption[] = [
  { value: "MAIN", label: "Main" },
  { value: "SUPPLEMENTARY", label: "Supplementary" },
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
  const allLabel = loading ? "Loading…" : failed ? "Could not load" : "All";
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
        aria-label="Product search"
        onSubmit={(event) => {
          event.preventDefault();
          onChange({ q: draft.trim() });
        }}
      >
        <label htmlFor="product-search-type" className="sr-only">
          Search by
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
            Search term
          </label>
          <InputText
            id="product-search-input"
            type="search"
            value={draft}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder={state.searchType === "categoryName" ? "Enter a category name" : "Enter a product name"}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" icon="pi pi-search" text aria-label="Search" className="product-search-button" />
        </span>
      </form>

      {/* Filters: Major → Medium → Minor category (each needs the one before) + product type */}
      <div className="product-filters" role="group" aria-label="Filters">
        <FilterSelect
          id="product-filter-category"
          label="Major category"
          value={state.categoryId ? String(state.categoryId) : ""}
          options={toOptions(categories.data)}
          loading={categories.isPending}
          failed={categories.isError}
          disabled={filtersOff}
          onChange={(value) => onChange({ categoryId: toId(value), subCategoryId: null, childCategoryId: null })}
        />
        <FilterSelect
          id="product-filter-subcategory"
          label="Medium category"
          value={state.subCategoryId ? String(state.subCategoryId) : ""}
          options={toOptions(subCategories.data)}
          loading={state.categoryId !== null && subCategories.isPending}
          failed={subCategories.isError}
          disabled={filtersOff || state.categoryId === null}
          onChange={(value) => onChange({ subCategoryId: toId(value), childCategoryId: null })}
        />
        <FilterSelect
          id="product-filter-childcategory"
          label="Minor category"
          value={state.childCategoryId ? String(state.childCategoryId) : ""}
          options={toOptions(childCategories.data)}
          loading={state.subCategoryId !== null && childCategories.isPending}
          failed={childCategories.isError}
          disabled={filtersOff || state.subCategoryId === null}
          onChange={(value) => onChange({ childCategoryId: toId(value) })}
        />
        <FilterSelect
          id="product-filter-type"
          label="Product type"
          value={state.productType ?? ""}
          options={PRODUCT_TYPE_OPTIONS}
          disabled={filtersOff}
          onChange={(value) => onChange({ productType: (value || null) as ProductType | null })}
        />
        <Button
          type="button"
          label="Reset filters"
          icon="pi pi-filter-slash"
          text
          className="product-filters-reset"
          disabled={!canReset}
          onClick={onReset}
        />
      </div>
      {filtersOff && (
        <p className="field-hint product-filters-hint">A category search looks at every category level, so the filters are off.</p>
      )}
    </div>
  );
}
