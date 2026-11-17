"use client";

import { useEffect, useRef, type DragEvent, type KeyboardEvent } from "react";
import { Button } from "primereact/button";
import { countLabel, LEVEL_INFO, nodeLabel, type CategoryNodeData } from "./category-nodes";

/** State + callbacks every row needs. CategoryTree builds it once and hands it down the recursion. */
export interface TreeControls {
  collapsed: ReadonlySet<string>;
  onToggle: (key: string) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  /** Drag handles are shown (user may update + no search active). */
  showHandles: boolean;
  /** false while a new order is being saved: moves wait until it is done. */
  canMove: boolean;
  /** Row whose delete request is running. */
  busyKey: string | null;
  /** Row whose handle gets focus back after a keyboard move. */
  focusKey: string | null;
  /** Row being dragged / row under the pointer (drop marker). */
  dragKey: string | null;
  dropKey: string | null;
  /** id of the "how to reorder" text, read out on every handle. */
  helpId: string;
  onAdd: (parent: CategoryNodeData) => void;
  onEdit: (node: CategoryNodeData, siblings: CategoryNodeData[]) => void;
  onDelete: (node: CategoryNodeData) => void;
  onMove: (node: CategoryNodeData, siblings: CategoryNodeData[], toIndex: number, by: "keyboard" | "drag") => void;
  onDragStart: (node: CategoryNodeData) => void;
  onDragOver: (node: CategoryNodeData) => void;
  onDragEnd: () => void;
}

interface CategoryNodeProps {
  node: CategoryNodeData;
  /** All nodes at the same level under the same parent (this node included). */
  siblings: CategoryNodeData[];
  index: number;
  tree: TreeControls;
}

// One row of the tree (any level) + its children. Renders itself again for each child, so the
// three levels share the same markup; only the indent, badge and add-button change per level.
export default function CategoryNode({ node, siblings, index, tree }: CategoryNodeProps) {
  const handleRef = useRef<HTMLSpanElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const info = LEVEL_INFO[node.level];
  const label = nodeLabel(node);
  const count = countLabel(node);
  const hasChildren = node.children.length > 0;
  const expanded = !tree.collapsed.has(node.key);
  const childrenId = `category-children-${node.key}`;
  const busy = tree.busyKey === node.key;

  // Drag state: only rows of the same parent + level are drop targets
  const dragIndex = tree.dragKey ? siblings.findIndex((sibling) => sibling.key === tree.dragKey) : -1;
  const isDragging = tree.dragKey === node.key;
  const dropPosition = dragIndex >= 0 && dragIndex !== index && tree.dropKey === node.key ? (dragIndex < index ? "after" : "before") : null;
  const hasHandle = tree.showHandles && siblings.length > 1;

  // After Alt+↑/↓ the moved row can lose focus (React moves its DOM node) → give it back to the handle
  useEffect(() => {
    if (tree.focusKey !== node.key) return;
    if (document.activeElement && document.activeElement !== document.body) return;
    handleRef.current?.focus();
  }, [tree.focusKey, node.key, index]);

  // Keyboard alternative to drag-and-drop: Alt+↑ / Alt+↓ on any control of this row
  const onRowKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
    if (!hasHandle) return;
    event.preventDefault();
    tree.onMove(node, siblings, index + (event.key === "ArrowUp" ? -1 : 1), "keyboard");
  };

  // Native drag-and-drop: the handle starts it, rows of the same group accept the drop
  const onDragStart = (event: DragEvent<HTMLSpanElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", node.key);
    if (rowRef.current) event.dataTransfer.setDragImage(rowRef.current, 0, 0);
    tree.onDragStart(node);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (dragIndex < 0 || isDragging) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (tree.dropKey !== node.key) tree.onDragOver(node);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (dragIndex < 0 || isDragging) return;
    event.preventDefault();
    tree.onMove(siblings[dragIndex], siblings, index, "drag");
    tree.onDragEnd();
  };

  const rowClasses = [
    "category-row",
    `category-row-depth-${node.depth}`,
    isDragging ? "category-row-dragging" : "",
    dropPosition ? `category-row-drop-${dropPosition}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <li className="category-node" data-level={node.level} data-id={node.id}>
      <div ref={rowRef} className={rowClasses} onKeyDown={onRowKeyDown} onDragOver={onDragOver} onDrop={onDrop}>
        {/* Start of the row: drag handle, expand/collapse chevron, level badge */}
        {hasHandle ? (
          <span
            ref={handleRef}
            role="button"
            tabIndex={0}
            className="category-handle"
            draggable={tree.canMove}
            aria-roledescription="드래그 핸들"
            aria-label={`${label} 순서 변경`}
            aria-describedby={tree.helpId}
            aria-disabled={tree.canMove ? undefined : true}
            title="드래그하여 순서 변경 (또는 Alt + ↑ / Alt + ↓)"
            onDragStart={onDragStart}
            onDragEnd={tree.onDragEnd}
          >
            <i className="pi pi-bars" aria-hidden="true" />
          </span>
        ) : (
          <span className="category-handle-space" aria-hidden="true" />
        )}

        {hasChildren ? (
          <button
            type="button"
            className="category-toggle"
            aria-expanded={expanded}
            aria-controls={childrenId}
            aria-label={`${label} 하위 ${info.childPlural}`}
            onClick={() => tree.onToggle(node.key)}
          >
            <i className={`pi ${expanded ? "pi-chevron-down" : "pi-chevron-right"}`} aria-hidden="true" />
          </button>
        ) : (
          <span className="category-toggle-space" aria-hidden="true" />
        )}

        {/* Name block: badge, [id] name, (N subcategories) — wraps on phones */}
        <span className="category-title">
          <span className={`category-badge category-badge-depth-${node.depth}`}>{info.badge}</span>
          <span className="category-id">[{node.id}]</span>
          <span className="category-name">{node.name}</span>
          {count && <span className="category-count">{count}</span>}
        </span>

        {/* Actions: + child (levels 1–2 only), edit, delete — each hidden without the permission */}
        <span className="category-actions">
          {tree.canCreate && info.childLevel && info.addLabel && (
            <Button
              type="button"
              icon="pi pi-plus"
              label={info.addLabel}
              severity="help"
              className="category-add"
              aria-label={`${label}에 ${LEVEL_INFO[info.childLevel].noun} 추가`}
              onClick={() => tree.onAdd(node)}
            />
          )}
          {tree.canUpdate && (
            <Button
              type="button"
              icon="pi pi-pencil"
              text
              rounded
              severity="secondary"
              className="category-icon-button"
              aria-label={`${label} 수정`}
              onClick={() => tree.onEdit(node, siblings)}
            />
          )}
          {tree.canDelete && (
            <Button
              type="button"
              icon={busy ? "pi pi-spin pi-spinner" : "pi pi-trash"}
              text
              rounded
              severity="danger"
              className="category-icon-button"
              aria-label={`${label} 삭제`}
              disabled={busy}
              onClick={() => tree.onDelete(node)}
            />
          )}
        </span>
      </div>

      {/* Children stay in the DOM when collapsed (hidden), so aria-controls always points somewhere */}
      {hasChildren && (
        <ul id={childrenId} className="category-children" hidden={!expanded}>
          {node.children.map((child, childIndex) => (
            <CategoryNode key={child.key} node={child} siblings={node.children} index={childIndex} tree={tree} />
          ))}
        </ul>
      )}
    </li>
  );
}
