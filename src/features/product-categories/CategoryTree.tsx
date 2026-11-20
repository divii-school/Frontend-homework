"use client";

import type { CategoryNode } from "@/types/category";
import { IconChevronDown16, IconPencil16, IconPlus16, IconTrash16 } from "@/components/icons";
import styles from "./CategoryTree.module.scss";

export interface CategoryTreeActions {
  onAddChild: (parent: CategoryNode) => void;
  onEdit: (node: CategoryNode) => void;
  onDelete: (node: CategoryNode) => void;
}

interface Props {
  nodes: CategoryNode[];
  expanded: ReadonlySet<number>;
  onToggle: (id: number) => void;
  /** Row buttons are shown only when actions are provided. */
  actions?: CategoryTreeActions;
}

/**
 * Figma 8.2.0 tree: [id] name (count), main rows on a tinted background,
 * indents 16 / 32 / 48px, "+ subcategory" on levels 1–2, edit + delete on every row.
 * Built as nested lists with disclosure buttons (aria-expanded).
 */
export function CategoryTree({ nodes, expanded, onToggle, actions }: Props) {
  return (
    <ul className={styles.tree}>
      {nodes.map((node) => (
        <TreeItem key={`${node.level}-${node.id}`} node={node} expanded={expanded} onToggle={onToggle} actions={actions} />
      ))}
    </ul>
  );
}

function TreeItem({ node, expanded, onToggle, actions }: Omit<Props, "nodes"> & { node: CategoryNode }) {
  const hasChildren = node.children.length > 0;
  const isOpen = hasChildren && expanded.has(node.id);
  const groupId = `cat-${node.level}-${node.id}`;

  return (
    <li className={styles.item}>
      <div className={`${styles.row} ${styles[`level${node.level}`]}`}>
        <div className={styles.label}>
          {hasChildren ? (
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={isOpen}
              aria-controls={groupId}
              aria-label={`${node.name} ${isOpen ? "접기" : "펼치기"}`}
              onClick={() => onToggle(node.id)}
            >
              <IconChevronDown16 className={isOpen ? undefined : styles.collapsed} />
            </button>
          ) : (
            <span className={styles["toggle-spacer"]} aria-hidden />
          )}
          <span className={styles.code}>[{node.id}]</span>
          <span className={styles.name}>{node.name}</span>
          {hasChildren && (
            <span className={styles.count}>
              (하위 {node.children.length}개)
            </span>
          )}
        </div>

        {actions && (
          <div className={styles.actions}>
            {node.level < 3 && (
              <button
                type="button"
                className={styles["add-button"]}
                onClick={() => actions.onAddChild(node)}
                aria-label={`${node.name} 하위 카테고리`}
              >
                <IconPlus16 />
                <span>하위 카테고리</span>
              </button>
            )}
            <button type="button" className={styles["icon-button"]} onClick={() => actions.onEdit(node)} aria-label={`${node.name} 수정`}>
              <IconPencil16 />
            </button>
            <button type="button" className={styles["icon-button"]} onClick={() => actions.onDelete(node)} aria-label={`${node.name} 삭제`}>
              <IconTrash16 />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <ul id={groupId} className={styles.tree}>
          {node.children.map((child) => (
            <TreeItem key={`${child.level}-${child.id}`} node={child} expanded={expanded} onToggle={onToggle} actions={actions} />
          ))}
        </ul>
      )}
    </li>
  );
}
