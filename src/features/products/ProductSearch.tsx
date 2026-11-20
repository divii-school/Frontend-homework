"use client";

import { useId, useState, type FormEvent } from "react";
import { IconSearch16 } from "@/components/icons";
import type { ProductSearchType } from "@/types/product";
import styles from "./ProductList.module.scss";

interface Props {
  initialType: ProductSearchType;
  initialSearch: string;
  onSearch: (type: ProductSearchType, search: string) => void;
}

/**
 * Figma 8.1.0 #2: field select (Product Name / Category Name) + term; Enter or the magnifier searches.
 * The parent renders this with key={URL search}, so back/forward refills it with the URL's values.
 */
export function ProductSearch({ initialType, initialSearch, onSearch }: Props) {
  const [type, setType] = useState<ProductSearchType>(initialType);
  const [draft, setDraft] = useState(initialSearch);
  const typeId = useId();
  const searchId = useId();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch(type, draft);
  }

  return (
    <form role="search" className={styles.search} onSubmit={submit}>
      <label htmlFor={typeId} className="visually-hidden">
        검색 조건
      </label>
      <select id={typeId} className={styles.type} value={type} onChange={(e) => setType(e.target.value as ProductSearchType)}>
        <option value="productName">상품명</option>
        <option value="categoryName">카테고리명</option>
      </select>
      <div className={styles["input-wrap"]}>
        <label htmlFor={searchId} className="visually-hidden">
          검색어
        </label>
        <input
          id={searchId}
          type="search"
          placeholder="검색어를 입력해 주세요"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className={styles["search-button"]} aria-label="검색">
          <IconSearch16 />
        </button>
      </div>
    </form>
  );
}
