"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconSearch16 } from "@/components/icons";
import { useProductCategories } from "@/hooks/useProductCategories";
import { errorMessage } from "@/lib/errors";
import type { CategoryNode } from "@/types/category";
import { CategoryTree } from "./CategoryTree";
import styles from "./CategoryManagement.module.scss";

function collectExpandableIds(nodes: CategoryNode[], into = new Set<number>()): Set<number> {
  for (const node of nodes) {
    if (node.children.length) {
      into.add(node.id);
      collectExpandableIds(node.children, into);
    }
  }
  return into;
}

/** Figma 8.2.0 Product Category Management. The search term lives in the URL (?search=). */
export function CategoryManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";

  const [draft, setDraft] = useState(search);
  // Rows the user collapsed; everything else is open (the design shows the tree expanded).
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(new Set());

  const query = useProductCategories(search);
  const nodes = useMemo(() => query.data ?? [], [query.data]);
  const allIds = useMemo(() => collectExpandableIds(nodes), [nodes]);
  const expanded = useMemo(() => new Set([...allIds].filter((id) => !collapsed.has(id))), [allIds, collapsed]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const term = draft.trim();
    if (term) params.set("search", term);
    else params.delete("search");
    setCollapsed(new Set());
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggle(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader title="Product Category Management" />

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <form role="search" className={styles.search} onSubmit={submitSearch}>
            <label htmlFor="category-search" className="visually-hidden">
              Search categories
            </label>
            <input
              id="category-search"
              type="search"
              placeholder="Category search..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={100}
            />
            <button type="submit" className={styles.searchButton} aria-label="Search">
              <IconSearch16 />
            </button>
          </form>

          <div className={styles.treeButtons}>
            <button type="button" className={styles.outlineButton} onClick={() => setCollapsed(new Set())} disabled={!nodes.length}>
              Expand all
            </button>
            <button type="button" className={styles.outlineButton} onClick={() => setCollapsed(new Set(allIds))} disabled={!nodes.length}>
              Fold all
            </button>
          </div>
        </div>

        <section className={styles.panel} aria-label="Category tree" aria-busy={query.isFetching}>
          {query.isPending ? (
            <div className={styles.skeleton} role="status">
              <span className="visually-hidden">Loading categories…</span>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles.skeletonRow} aria-hidden />
              ))}
            </div>
          ) : query.isError ? (
            <div className={styles.message} role="alert">
              <p>{errorMessage(query.error)}</p>
              <button type="button" className={styles.outlineButton} onClick={() => query.refetch()}>
                Try again
              </button>
            </div>
          ) : nodes.length === 0 ? (
            <div className={styles.message} role="status">
              <p>{search ? "No search results found." : "No categories yet."}</p>
            </div>
          ) : (
            <CategoryTree nodes={nodes} expanded={expanded} onToggle={toggle} />
          )}
        </section>
      </div>
    </>
  );
}
