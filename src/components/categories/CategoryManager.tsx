"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "primereact/button";
import { AlertDialog, StateWrapper } from "@/components";
import { ROUTE_KEYS } from "@/config/navigation";
import type { CategoryLevel } from "@/api-services/ProductCategoryService.types";
import { useGetCategoryTree } from "@/hooks/API/categories/useGetCategoryTree";
import { useDeleteCategory, useReorderCategories } from "@/hooks/API/categories/useCategoryMutations";
import { useCan } from "@/hooks/useCan";
import { useToast } from "@/providers/ToastProvider";
import { getApiMessage } from "@/utils/api-messages";
import { confirmDelete } from "@/utils/confirm";
import { CATEGORY_RULES } from "@/utils/constants";
import CategoryFormDialog, { type CategoryFormTarget } from "./CategoryFormDialog";
import CategoryToolbar from "./CategoryToolbar";
import CategoryTree from "./CategoryTree";
import CategoryTreeSkeleton from "./CategoryTreeSkeleton";
import { keysWithChildren, LEVEL_INFO, nodeLabel, toNodes, type CategoryNodeData } from "./category-nodes";

// 8.2.0 Product Category Management — the screen's "brain":
//  - search term lives in the URL (?q=) and is sent to the API (server-side search)
//  - server data only through the hooks (tree query + save / delete / reorder mutations)
//  - screen-only state: collapsed rows, the add/edit dialog, the "cannot delete" alert
export default function CategoryManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = (searchParams.get("q") ?? "").trim();

  const tree = useGetCategoryTree(searchTerm);
  const reorder = useReorderCategories();
  const remove = useDeleteCategory();
  const toast = useToast();

  // Button permissions from the one navigation config (never role checks here)
  const canCreate = useCan(ROUTE_KEYS.CATEGORIES, "create");
  const canUpdate = useCan(ROUTE_KEYS.CATEGORIES, "update");
  const canDelete = useCan(ROUTE_KEYS.CATEGORIES, "delete");

  // Rows are expanded unless their key is in this set (so new rows show up expanded)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [form, setForm] = useState<{ target: CategoryFormTarget; open: boolean } | null>(null);
  const [blocked, setBlocked] = useState<{ message: string; open: boolean } | null>(null);

  const nodes = useMemo(() => toNodes(tree.data?.categories ?? []), [tree.data]);
  const isSearching = tree.isFetching && tree.isPlaceholderData;

  // ---- Search: put the term in the URL; the query hook refetches with it --------------------
  const handleSearch = (term: string) => {
    const next = term.trim();
    setCollapsed(new Set()); // show every match
    if (next === searchTerm) {
      void tree.refetch();
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set("q", next);
    else params.delete("q");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  // ---- Expand / collapse -----------------------------------------------------------------
  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // ---- Add / edit dialog -----------------------------------------------------------------
  const openForm = (target: CategoryFormTarget) => setForm({ target, open: true });
  const closeForm = () => setForm((current) => (current ? { ...current, open: false } : current));

  const registerMain = () =>
    openForm({ mode: "add", level: "category", initialName: "", siblingNames: nodes.map((node) => node.name) });

  const addChild = (parent: CategoryNodeData) => {
    const childLevel = LEVEL_INFO[parent.level].childLevel;
    if (!childLevel) return; // depth limit: nothing under a minor category
    openForm({
      mode: "add",
      level: childLevel,
      parentId: parent.id,
      parentKey: parent.key,
      parentLabel: nodeLabel(parent),
      initialName: "",
      siblingNames: parent.children.map((child) => child.name),
    });
  };

  const edit = (node: CategoryNodeData, siblings: CategoryNodeData[]) =>
    openForm({
      mode: "edit",
      level: node.level,
      id: node.id,
      parentId: node.parentId,
      initialName: node.name,
      siblingNames: siblings.filter((sibling) => sibling.key !== node.key).map((sibling) => sibling.name),
    });

  // After an add, make sure the parent is open so the new row is visible
  const onSaved = (target: CategoryFormTarget) => {
    const parentKey = target.parentKey;
    if (parentKey) {
      setCollapsed((current) => {
        const next = new Set(current);
        next.delete(parentKey);
        return next;
      });
    }
    closeForm();
  };

  // ---- Delete: blocked while children exist (no request), otherwise confirm first ---------
  // A search never hides the children of a row it shows, so this check is safe during a search too.
  const deleteNode = async (node: CategoryNodeData) => {
    const info = LEVEL_INFO[node.level];
    if (node.children.length > 0) {
      setBlocked({
        message: `Cannot delete "${nodeLabel(node)}": it has ${info.childPlural}. Delete them first.`,
        open: true,
      });
      return;
    }
    const ok = await confirmDelete(`Delete the ${info.noun} "${nodeLabel(node)}"? This cannot be undone.`, `Delete ${info.noun}`);
    if (!ok) return;
    remove.mutate(
      { level: node.level, id: node.id },
      {
        onSuccess: (res) => toast.success(getApiMessage(res.message, "Deleted.")),
        onError: (error) => toast.error("Could not delete the category", error.message),
      },
    );
  };

  // ---- Reorder: the hook updates the tree at once and rolls back if the API refuses -------
  const saveOrder = (level: CategoryLevel, ids: number[]) =>
    reorder.mutate(
      { level, ids },
      {
        onSuccess: (res) => toast.success(getApiMessage(res.message, "Order saved.")),
        onError: (error) => toast.error("Could not save the new order", error.message),
      },
    );

  // ---- "Register main category": allowed only with permission and below the 3-category limit
  const registerReason = !canCreate
    ? "Your account cannot register categories."
    : tree.data && !tree.data.isCreatable
      ? `Up to ${CATEGORY_RULES.maxTopLevel} main categories can be registered. Delete one to add another.`
      : null;
  const registerDisabled = !canCreate || !tree.data?.isCreatable;

  const busyKey = remove.isPending && remove.variables ? `${remove.variables.level}-${remove.variables.id}` : null;

  return (
    <section className="content-card category-page" aria-label="Product categories">
      <CategoryToolbar
        searchTerm={searchTerm}
        onSearch={handleSearch}
        canToggleAll={nodes.some((node) => node.children.length > 0)}
        onExpandAll={() => setCollapsed(new Set())}
        onCollapseAll={() => setCollapsed(new Set(keysWithChildren(nodes)))}
        registerDisabled={registerDisabled}
        registerReason={registerReason}
        onRegister={registerMain}
      />

      {/* A new search keeps the old tree on screen; this line says the new one is loading */}
      {isSearching && (
        <p className="category-searching" role="status">
          <i className="pi pi-spin pi-spinner" aria-hidden="true" /> Searching…
        </p>
      )}

      {/* Tree with its loading / error / empty states */}
      <StateWrapper
        isLoading={tree.isPending}
        isError={tree.isError}
        error={tree.error}
        onRetry={() => void tree.refetch()}
        loadingFallback={<CategoryTreeSkeleton />}
        isEmpty={nodes.length === 0}
        emptyIcon={searchTerm ? "pi pi-search" : "pi pi-sitemap"}
        emptyTitle={searchTerm ? "No search results found" : "No categories yet"}
        emptyDescription={
          searchTerm ? `No category matches "${searchTerm}". Try another name.` : "Register a main category to start the tree."
        }
        emptyAction={
          searchTerm ? <Button type="button" label="Clear search" outlined onClick={() => handleSearch("")} /> : undefined
        }
      >
        <CategoryTree
          nodes={nodes}
          collapsed={collapsed}
          onToggle={toggle}
          canCreate={canCreate}
          canUpdate={canUpdate}
          canDelete={canDelete}
          isSearch={searchTerm.length > 0}
          isSavingOrder={reorder.isPending}
          busyKey={busyKey}
          onAdd={addChild}
          onEdit={edit}
          onDelete={(node) => void deleteNode(node)}
          onReorder={saveOrder}
        />
      </StateWrapper>

      <CategoryFormDialog visible={form?.open ?? false} target={form?.target ?? null} onClose={closeForm} onSaved={onSaved} />

      <AlertDialog
        visible={blocked?.open ?? false}
        title="Cannot delete"
        message={blocked?.message ?? ""}
        onClose={() => setBlocked((current) => (current ? { ...current, open: false } : current))}
      />
    </section>
  );
}
