"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { useEffect, useMemo, useRef, useState } from "react";
import { CategoryDialog, LEVEL_LABEL } from "@/components/categories/CategoryDialog";
import { CategoryTree } from "@/components/categories/CategoryTree";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeading } from "@/components/common/PageHeading";
import { Pagination } from "@/components/common/Pagination";
import { ErrorState, StateBlock } from "@/components/common/StateBlock";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { NAV_GROUP_LABEL, canDo } from "@/config/navigation";
import { PAGE_SIZE_OPTIONS, SEARCH_DEBOUNCE_MS } from "@/constants/products";
import { useDeleteCategory, useGetCategoryTree } from "@/hooks/API/categories/useCategories";
import type { Category, CategoryTarget } from "@/types/category";
import { formatCount } from "@/utils/format";

type CategorySort = "order" | "name-asc" | "name-desc";
const SORT_OPTIONS: { label: string; value: CategorySort }[] = [
  { label: "등록 순서", value: "order" },
  { label: "이름 오름차순", value: "name-asc" },
  { label: "이름 내림차순", value: "name-desc" },
];

function sortCategories(categories: Category[], sort: CategorySort): Category[] {
  const direction = sort === "name-desc" ? -1 : 1;
  return [...categories].sort((a, b) =>
    sort === "order" ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name, "ko") * direction,
  );
}

/**
 * Category management. Search is done by the server (GET /product-category/list?search=). That endpoint returns
 * the whole tree with no sort or paging parameters, so the 대분류 rows are sorted and paged here.
 * Search, sort, page and page size are in the URL, like the product list.
 */
export function CategoryList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const showToast = useToast();

  const search = (searchParams.get("search") ?? "").trim();
  const sort = SORT_OPTIONS.some((option) => option.value === searchParams.get("sort")) ? (searchParams.get("sort") as CategorySort) : "order";
  const limitParam = Number(searchParams.get("limit"));
  const limit = (PAGE_SIZE_OPTIONS as readonly number[]).includes(limitParam) ? limitParam : PAGE_SIZE_OPTIONS[0];
  const pageParam = Number(searchParams.get("page"));
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const tree = useGetCategoryTree(search);
  const deleteCategory = useDeleteCategory();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<CategoryTarget | null>(null);
  const [deleting, setDeleting] = useState<CategoryTarget | null>(null);
  const [searchText, setSearchText] = useState(search);
  // The last value this box wrote to the URL (see ProductsToolbar): our own update keeps what was typed in the
  // meantime; any other change of the URL (Back button, a shared link) is copied into the box.
  const sentSearch = useRef(search);
  useEffect(() => {
    if (search === sentSearch.current) return;
    sentSearch.current = search;
    setSearchText(search);
  }, [search]);

  // Reads the address as it is when called, so a change started a moment earlier (sort, page) is kept.
  const setQuery = (changes: Record<string, string | number | null>) => {
    const query = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === "") query.delete(key);
      else query.set(key, String(value));
    });
    const text = query.toString();
    router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
  };

  // Typing waits a moment, then the search goes to the URL and from there to the server. A new search starts at page 1.
  useEffect(() => {
    const wanted = searchText.trim();
    if (wanted === sentSearch.current) return;
    const timer = window.setTimeout(() => {
      sentSearch.current = wanted;
      setQuery({ search: wanted, page: null });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // setQuery is recreated on every render; the effect must follow the text only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const sorted = useMemo(() => sortCategories(tree.data?.categories ?? [], sort), [tree.data, sort]);
  // A page past the end (the last row of the last page was deleted) shows the last page that exists.
  const currentPage = Math.min(page, Math.max(1, Math.ceil(sorted.length / limit)));
  const pageRows = sorted.slice((currentPage - 1) * limit, currentPage * limit);
  const allKeys = useMemo(
    () => sorted.flatMap((category) => [`category-${category.id}`, ...category.subCategories.map((sub) => `sub-${sub.id}`)]),
    [sorted],
  );

  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleDelete = () => {
    if (!deleting?.id) return;
    deleteCategory.mutate(
      { level: deleting.level, id: deleting.id },
      {
        onSuccess: () => {
          showToast({ severity: "success", summary: "삭제 완료", detail: `${deleting.name} 카테고리를 삭제했습니다.` });
          setDeleting(null);
        },
      },
    );
  };

  const canWrite = canDo(user, "category.write");

  return (
    <>
      <PageHeading
        title="상품 카테고리 관리"
        breadcrumb={[NAV_GROUP_LABEL, "상품 카테고리 관리"]}
        actions={
          // The API says when another 대분류 may be added (isCreatable); the QA server has reached its limit.
          canWrite &&
          tree.data?.canCreateTopLevel && <Button type="button" label="대분류 등록" icon="pi pi-plus" onClick={() => setEditing({ level: "category" })} />
        }
      />
      <section className="panel" aria-label="카테고리 목록">
        <div className="list-toolbar">
          <div className="list-toolbar-filters" role="search">
            <span className="p-input-icon-left list-toolbar-search">
              <i className="pi pi-search" aria-hidden="true" />
              <InputText value={searchText} placeholder="카테고리 검색" aria-label="카테고리 검색" onChange={(event) => setSearchText(event.target.value)} />
            </span>
            <Dropdown value={sort} options={SORT_OPTIONS} aria-label="정렬" onChange={(event) => setQuery({ sort: event.value === "order" ? null : event.value, page: null })} />
          </div>
          <div className="list-toolbar-actions">
            <p className="list-toolbar-count" aria-live="polite">
              대분류: <strong>{tree.data ? formatCount(tree.data.categories.length) : "-"}</strong>
            </p>
            <Button type="button" label="모두 펼치기" outlined disabled={allKeys.length === 0} onClick={() => setExpanded(new Set(allKeys))} />
            <Button type="button" label="모두 접기" outlined disabled={expanded.size === 0} onClick={() => setExpanded(new Set())} />
          </div>
        </div>
        {tree.isPending ? (
          <StateBlock kind="loading" title="카테고리를 불러오는 중입니다." />
        ) : tree.isError ? (
          <ErrorState error={tree.error} onRetry={() => tree.refetch()} />
        ) : sorted.length === 0 ? (
          <StateBlock kind="empty" title={search ? "검색 결과가 없습니다." : "등록된 카테고리가 없습니다."} />
        ) : (
          <>
            <CategoryTree
              categories={pageRows}
              expanded={expanded}
              canWrite={canWrite}
              canDelete={canDo(user, "category.delete")}
              onToggle={toggle}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
            <Pagination
              page={currentPage}
              limit={limit}
              totalRecords={sorted.length}
              onChange={(nextPage, nextLimit) =>
                setQuery({ page: nextPage === 1 ? null : nextPage, limit: nextLimit === PAGE_SIZE_OPTIONS[0] ? null : nextLimit })
              }
            />
          </>
        )}
      </section>
      {editing && <CategoryDialog key={`${editing.level}-${editing.id ?? "new"}-${editing.parentId ?? 0}`} target={editing} onClose={() => setEditing(null)} />}
      <ConfirmDialog
        visible={deleting !== null}
        title={`${deleting ? LEVEL_LABEL[deleting.level] : ""} 삭제`}
        confirmLabel="삭제"
        pending={deleteCategory.isPending}
        error={deleteCategory.error}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleting(null);
          deleteCategory.reset();
        }}
      >
        <p>
          <strong>{deleting?.name}</strong> 카테고리를 삭제하시겠습니까?{" "}
          {deleting?.level === "child" ? "삭제하면 되돌릴 수 없습니다." : "하위 카테고리도 함께 삭제되며 되돌릴 수 없습니다."}
        </p>
      </ConfirmDialog>
    </>
  );
}
