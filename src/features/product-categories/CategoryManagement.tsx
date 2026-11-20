"use client";

import { useMemo, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconSearch16 } from "@/components/icons";
import { useProductCategories } from "@/hooks/useProductCategories";
import { errorMessage } from "@/lib/errors";
import type { CategoryLevel, CategoryNode } from "@/types/category";
import btn from "@/components/ui/Button.module.scss";
import { CategoryTree, type CategoryTreeActions } from "./CategoryTree";
import { CategoryFormDialog, type CategoryFormTarget } from "./CategoryFormDialog";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
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
  const [formTarget, setFormTarget] = useState<CategoryFormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);

  const actions: CategoryTreeActions = {
    onAddChild: (parent) => {
      // Make sure the new child is visible once it appears.
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(parent.id);
        return next;
      });
      setFormTarget({ mode: "create", level: (parent.level + 1) as CategoryLevel, parent });
    },
    onEdit: (node) => setFormTarget({ mode: "edit", node }),
    onDelete: (node) => setDeleteTarget(node),
  };

  const formKey =
    formTarget?.mode === "edit"
      ? `edit-${formTarget.node.level}-${formTarget.node.id}`
      : formTarget
        ? `create-${formTarget.level}-${formTarget.parent?.id ?? "root"}`
        : "";

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
      <PageHeader title="상품 카테고리 관리" />

      <div className={styles.content}>
        <div className={styles.toolbar}>
          <form role="search" className={styles.search} onSubmit={submitSearch}>
            <label htmlFor="category-search" className="visually-hidden">
              카테고리 검색
            </label>
            <input
              id="category-search"
              type="search"
              placeholder="카테고리 검색..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={100}
            />
            <button type="submit" className={styles["search-button"]} aria-label="검색">
              <IconSearch16 />
            </button>
          </form>

          <div className={styles["tree-buttons"]}>
            <button type="button" className={styles["outline-button"]} onClick={() => setCollapsed(new Set())} disabled={!nodes.length}>
              전체 펼치기
            </button>
            <button type="button" className={styles["outline-button"]} onClick={() => setCollapsed(new Set(allIds))} disabled={!nodes.length}>
              전체 접기
            </button>
          </div>

          <button
            type="button"
            className={`${btn.button} ${btn.primary} ${styles.register}`}
            onClick={() => setFormTarget({ mode: "create", level: 1, parent: null })}
          >
            등록
          </button>
        </div>

        <section className={styles.panel} aria-label="카테고리 목록" aria-busy={query.isFetching}>
          {query.isPending ? (
            <div className={styles.skeleton} role="status">
              <span className="visually-hidden">카테고리를 불러오는 중…</span>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={styles["skeleton-row"]} aria-hidden />
              ))}
            </div>
          ) : query.isError ? (
            <div className={styles.message} role="alert">
              <p>{errorMessage(query.error)}</p>
              <button type="button" className={styles["outline-button"]} onClick={() => query.refetch()}>
                다시 시도
              </button>
            </div>
          ) : nodes.length === 0 ? (
            <div className={styles.message} role="status">
              <p>{search ? "검색 결과가 없습니다." : "등록된 카테고리가 없습니다."}</p>
            </div>
          ) : (
            <CategoryTree nodes={nodes} expanded={expanded} onToggle={toggle} actions={actions} />
          )}
        </section>
      </div>

      {formTarget && <CategoryFormDialog key={formKey} target={formTarget} onClose={() => setFormTarget(null)} />}
      {deleteTarget && (
        <DeleteCategoryDialog key={`${deleteTarget.level}-${deleteTarget.id}`} node={deleteTarget} onClose={() => setDeleteTarget(null)} />
      )}
    </>
  );
}
