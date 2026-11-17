"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";

interface CategoryToolbarProps {
  /** The search term currently in the URL (?q=). */
  searchTerm: string;
  onSearch: (term: string) => void;
  /** Expand / collapse need a tree with at least one parent row. */
  canToggleAll: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  registerDisabled: boolean;
  /** Visible text saying why "Register main category" is disabled (null = enabled or still loading). */
  registerReason: string | null;
  onRegister: () => void;
}

// Row above the tree (design ② ③ ④ ⑤): search box, Expand all / Collapse all, Register main category.
// The search runs on Enter or the magnifier click — not on every key — and the term goes to the URL.
export default function CategoryToolbar({
  searchTerm,
  onSearch,
  canToggleAll,
  onExpandAll,
  onCollapseAll,
  registerDisabled,
  registerReason,
  onRegister,
}: CategoryToolbarProps) {
  const [draft, setDraft] = useState(searchTerm);

  // Back / forward or a cleared search changes the URL → show that term in the box
  useEffect(() => {
    setDraft(searchTerm);
  }, [searchTerm]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(draft);
  };

  return (
    <div className="category-toolbar">
      {/* Search (design ②): grey box, magnifier on the left = search button */}
      <form role="search" className="category-search" onSubmit={submit}>
        <label htmlFor="category-search-input" className="sr-only">
          Search categories
        </label>
        <button type="submit" className="category-search-submit" aria-label="Search">
          <i className="pi pi-search" aria-hidden="true" />
        </button>
        <InputText
          id="category-search-input"
          className="category-search-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Category search..."
          enterKeyHint="search"
          autoComplete="off"
        />
        {draft && (
          <button
            type="button"
            className="category-search-clear"
            aria-label="Clear search"
            onClick={() => {
              setDraft("");
              onSearch("");
            }}
          >
            <i className="pi pi-times" aria-hidden="true" />
          </button>
        )}
      </form>

      {/* Expand all / Collapse all (design ③ ④) */}
      <div className="category-toolbar-toggles">
        <Button type="button" label="Expand all" outlined disabled={!canToggleAll} onClick={onExpandAll} />
        <Button type="button" label="Collapse all" outlined disabled={!canToggleAll} onClick={onCollapseAll} />
      </div>

      {/* Register main category (design ⑤) + the reason when it is not allowed */}
      <div className="category-toolbar-register">
        <Button
          type="button"
          label="Register main category"
          icon="pi pi-plus"
          disabled={registerDisabled}
          aria-describedby={registerReason ? "category-register-reason" : undefined}
          onClick={onRegister}
        />
        {registerReason && (
          <p id="category-register-reason" className="category-register-reason">
            <i className="pi pi-info-circle" aria-hidden="true" /> {registerReason}
          </p>
        )}
      </div>
    </div>
  );
}
