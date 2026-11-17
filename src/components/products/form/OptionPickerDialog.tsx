"use client";

import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { StateWrapper } from "@/components";
import { useGetProductList } from "@/hooks/API/products/useGetProductList";
import { useDebounce } from "@/hooks/useDebounce";
import type { Product } from "@/api-services/ProductService.types";
import { formatWon } from "@/utils/format";

interface OptionPickerDialogProps {
  /** Products already in the option table (shown ticked + disabled). */
  pickedIds: number[];
  /** The product being edited (cannot be its own option). */
  excludeId?: number;
  onAdd: (products: Product[]) => void;
  onClose: () => void;
}

const PICKER_PAGE_SIZE = 20;

// "Single-item option" popup (design 8.1.3): search existing products by name (product list API, list A),
// tick one or more, "Register" adds them to the option table. Mounted only while open, so the list
// request runs only when the popup is shown.
export default function OptionPickerDialog({ pickedIds, excludeId, onAdd, onClose }: OptionPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<number, Product>>(new Map());
  const debouncedSearch = useDebounce(search.trim());
  const query = useGetProductList({ searchType: "productName", page: 1, limit: PICKER_PAGE_SIZE, search: debouncedSearch || undefined });
  const rows = (query.data?.items ?? []).filter((product) => product.id !== excludeId);
  const total = query.data?.totalRecords ?? 0;

  const toggle = (product: Product, checked: boolean) =>
    setSelected((current) => {
      const next = new Map(current);
      if (checked) next.set(product.id, product);
      else next.delete(product.id);
      return next;
    });

  const footer = (
    <div className="option-picker-footer">
      <Button type="button" label="취소" outlined onClick={onClose} />
      <Button
        type="button"
        label={selected.size > 0 ? `등록하기 (${selected.size})` : "등록하기"}
        disabled={selected.size === 0}
        onClick={() => onAdd(Array.from(selected.values()))}
      />
    </div>
  );

  return (
    <Dialog
      visible
      onHide={onClose}
      header={
        <span className="option-picker-title">
          <i className="pi pi-book" aria-hidden="true" /> 단권 옵션
        </span>
      }
      footer={footer}
      className="option-picker-dialog"
      draggable={false}
      resizable={false}
      blockScroll
    >
      {/* 1. Search by product name */}
      <div className="option-picker-search">
        <label htmlFor="option-picker-search" className="sr-only">
          상품명 검색
        </label>
        <InputText
          id="option-picker-search"
          value={search}
          autoFocus
          placeholder="상품명 검색"
          autoComplete="off"
          onChange={(event) => setSearch(event.target.value)}
        />
        <i className="pi pi-search" aria-hidden="true" />
      </div>

      {/* 2. Result list with checkboxes */}
      <StateWrapper
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        isEmpty={rows.length === 0}
        emptyTitle="검색 결과가 없습니다"
        emptyDescription={debouncedSearch ? `“${debouncedSearch}” 검색어에 해당하는 상품이 없습니다.` : "등록된 상품이 없습니다."}
      >
        <ul className="option-picker-list" aria-label="상품 목록" aria-busy={query.isFetching}>
          {rows.map((product) => {
            const already = pickedIds.includes(product.id);
            const inputId = `option-pick-${product.id}`;
            return (
              <li key={product.id} className="option-picker-row">
                <Checkbox
                  inputId={inputId}
                  checked={already || selected.has(product.id)}
                  disabled={already}
                  onChange={(event) => toggle(product, Boolean(event.checked))}
                />
                <label htmlFor={inputId} className="option-picker-name">
                  <span>{product.productName}</span>
                  <span className="option-picker-code">
                    {product.productCode}
                    {already ? " · 이미 추가됨" : ""}
                  </span>
                </label>
                <span className="option-picker-price">{formatWon(product.unitPrice)}</span>
              </li>
            );
          })}
        </ul>
        {total > rows.length && (
          <p className="field-hint">
            전체 {total}건 중 최신 {rows.length}건만 표시됩니다. 상품명을 입력하여 검색해 주세요.
          </p>
        )}
      </StateWrapper>
    </Dialog>
  );
}
