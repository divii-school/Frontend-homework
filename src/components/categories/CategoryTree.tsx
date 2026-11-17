"use client";

import { useId, useState } from "react";
import type { CategoryLevel } from "@/api-services/ProductCategoryService.types";
import CategoryNode, { type TreeControls } from "./CategoryNode";
import { moveItem, nodeLabel, type CategoryNodeData } from "./category-nodes";

interface CategoryTreeProps {
  nodes: CategoryNodeData[];
  collapsed: ReadonlySet<string>;
  onToggle: (key: string) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** A search shows only part of the siblings, so reordering is switched off while it is active. */
  isSearch: boolean;
  /** A new order is being saved. */
  isSavingOrder: boolean;
  /** Row whose delete request is running. */
  busyKey: string | null;
  onAdd: (parent: CategoryNodeData) => void;
  onEdit: (node: CategoryNodeData, siblings: CategoryNodeData[]) => void;
  onDelete: (node: CategoryNodeData) => void;
  /** Saves the new order of one sibling group (ids in the new order). */
  onReorder: (level: CategoryLevel, ids: number[]) => void;
}

// The 3-level tree (design ⑥). Holds only screen state: which row is dragged, which row is under
// the pointer, which handle gets focus back after a keyboard move, and the screen-reader message.
export default function CategoryTree({
  nodes,
  collapsed,
  onToggle,
  canCreate,
  canUpdate,
  canDelete,
  isSearch,
  isSavingOrder,
  busyKey,
  onAdd,
  onEdit,
  onDelete,
  onReorder,
}: CategoryTreeProps) {
  const helpId = useId();
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const showHandles = canUpdate && !isSearch;

  // Move one row inside its sibling group, then save the whole group's order (ids, new order)
  const move: TreeControls["onMove"] = (node, siblings, toIndex, by) => {
    const from = siblings.findIndex((sibling) => sibling.key === node.key);
    if (isSavingOrder || from < 0 || toIndex < 0 || toIndex >= siblings.length || toIndex === from) return;
    setFocusKey(by === "keyboard" ? node.key : null);
    setAnnouncement(`${nodeLabel(node)} 항목을 ${siblings.length}개 중 ${toIndex + 1}번째 위치로 이동했습니다.`);
    onReorder(
      node.level,
      moveItem(siblings, from, toIndex).map((sibling) => sibling.id),
    );
  };

  const controls: TreeControls = {
    collapsed,
    onToggle,
    canCreate,
    canUpdate,
    canDelete,
    showHandles,
    canMove: !isSavingOrder,
    busyKey,
    focusKey,
    dragKey,
    dropKey,
    helpId,
    onAdd,
    onEdit,
    onDelete,
    onMove: move,
    onDragStart: (node) => {
      setDragKey(node.key);
      setDropKey(null);
    },
    onDragOver: (node) => setDropKey(node.key),
    onDragEnd: () => {
      setDragKey(null);
      setDropKey(null);
    },
  };

  return (
    <div className="category-tree-wrap">
      {/* How to reorder (also read out on every drag handle) */}
      {showHandles && (
        <p id={helpId} className="category-tree-help">
          <i className="pi pi-bars" aria-hidden="true" /> 핸들을 드래그하여 동일 레벨 내에서 순서를 변경하거나, 행에 포커스를 두고 Alt + ↑ / Alt + ↓ 키를 눌러 주세요.
        </p>
      )}
      {isSearch && canUpdate && <p className="category-tree-help">순서를 변경하려면 검색을 초기화해 주세요.</p>}

      <ul className="category-tree" aria-label="상품 카테고리">
        {nodes.map((node, index) => (
          <CategoryNode key={node.key} node={node} siblings={nodes} index={index} tree={controls} />
        ))}
      </ul>

      {/* Announces keyboard / drag moves to screen readers */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
