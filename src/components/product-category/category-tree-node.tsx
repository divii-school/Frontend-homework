'use client';

import type { DragEvent, KeyboardEvent } from 'react';
import { useChildCategories } from '@/hooks/api/product-category/use-product-categories';
import { CHILD_LEVEL, LEVEL_LABEL, type CategoryLevel } from '@/types/product-category';
import { useAuth } from '@/providers/auth-provider';
import { decodeEntities } from '@/lib/text';
import { useCategoryTree, type TreeNodeData } from './category-tree-context';
import styles from './product-category.module.scss';

interface Props {
  node: TreeNodeData;
  level: CategoryLevel;
  /** Parent's id (undefined for a 대분류). */
  parentId?: number;
  /** Search mode: children come with the node and are not fetched. */
  presetChildren?: TreeNodeData[];
  /** Drag/keyboard reordering is allowed for this sibling group. */
  reorderable: boolean;
  index: number;
  siblingCount: number;
}

/**
 * One row of the tree (Figma 8.2.0 node): chevron · [code] name · (n개 하위) · + 하위 · edit · delete.
 * Children load only when the node is open (or, for a 대분류, at once so the count shows).
 */
export function CategoryTreeNode({ node: rawNode, level, parentId, presetChildren, reorderable, index, siblingCount }: Props) {
  const node = { ...rawNode, name: decodeEntities(rawNode.name) };
  const tree = useCategoryTree();
  const { can } = useAuth();
  const childLevel = CHILD_LEVEL[level];
  const expanded = tree.isExpanded(level, node.id);
  // 대분류 children are fetched up front for the "(n개 중분류)" count; deeper levels when opened.
  const fetchChildren = childLevel !== null && presetChildren === undefined && (level === 'category' || expanded);
  const childrenQuery = useChildCategories(childLevel ?? 'childCategory', node.id, fetchChildren);
  const children = presetChildren ?? childrenQuery.data;
  const canEdit = can('categoryManagement');

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      tree.move(level, parentId ?? 0, index, index - 1);
    }
    if (event.key === 'ArrowDown' && index < siblingCount - 1) {
      event.preventDefault();
      tree.move(level, parentId ?? 0, index, index + 1);
    }
  };

  const dragProps = reorderable
    ? {
        onDragOver: (event: DragEvent) => {
          if (tree.dragging?.level === level && tree.dragging.parentId === (parentId ?? 0)) event.preventDefault();
        },
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          if (tree.dragging) tree.move(level, parentId ?? 0, tree.dragging.index, index);
        },
      }
    : {};

  return (
    <li className={styles['tree-item']}>
      <div className={`${styles['tree-row']} ${styles[`level-${depth(level)}`]}`} {...dragProps}>
        {reorderable && canEdit && (
          <button
            type="button"
            className={styles['drag-handle']}
            draggable
            onDragStart={() => tree.setDragging({ level, parentId: parentId ?? 0, index })}
            onDragEnd={() => tree.setDragging(null)}
            onKeyDown={onHandleKey}
            aria-label={`${node.name} 순서 변경 (위/아래 화살표)`}
          >
            <i className="pi pi-bars" aria-hidden />
          </button>
        )}
        {childLevel ? (
          <button
            type="button"
            className={styles['toggle']}
            onClick={() => tree.toggle(level, node.id)}
            aria-expanded={expanded}
            aria-label={expanded ? `${node.name} 접기` : `${node.name} 펼치기`}
          >
            <i className={`pi ${expanded ? 'pi-chevron-down' : 'pi-chevron-right'}`} aria-hidden />
          </button>
        ) : (
          <span className={styles['toggle-spacer']} aria-hidden />
        )}

        <span className={`${styles['level-badge']} ${styles[`badge-${depth(level)}`]}`}>{LEVEL_LABEL[level]}</span>
        <span className={styles['node-code']}>[{node.id}]</span>
        <span className={styles['node-name']}>{node.name}</span>
        {childLevel && children && (
          <span className={styles['node-count']}>
            ({children.length}개 {LEVEL_LABEL[childLevel]})
          </span>
        )}

        {canEdit && (
          <span className={styles['node-actions']}>
            {childLevel && (
              <button
                type="button"
                className={styles['add-child']}
                onClick={() => tree.openDialog({ mode: 'add', level: childLevel, parentId: node.id, parentName: node.name })}
              >
                <i className="pi pi-plus" aria-hidden /> {LEVEL_LABEL[childLevel]}
              </button>
            )}
            <button
              type="button"
              className={styles['icon-action']}
              onClick={() => tree.openDialog({ mode: 'edit', level, id: node.id, name: node.name, parentId })}
              aria-label={`${node.name} 수정`}
              title="수정"
            >
              <i className="pi pi-pencil" aria-hidden />
            </button>
            <button
              type="button"
              className={styles['icon-action']}
              onClick={() => tree.requestDelete({ level, node, childCount: children?.length })}
              aria-label={`${node.name} 삭제`}
              title="삭제"
            >
              <i className="pi pi-trash" aria-hidden />
            </button>
          </span>
        )}
      </div>

      {childLevel && expanded && (
        <ChildList
          level={childLevel}
          parentId={node.id}
          nodes={children}
          loading={presetChildren === undefined && childrenQuery.isLoading}
          error={presetChildren === undefined && childrenQuery.isError}
          onRetry={() => void childrenQuery.refetch()}
          searchMode={presetChildren !== undefined}
        />
      )}
    </li>
  );
}

function ChildList(props: {
  level: CategoryLevel;
  parentId: number;
  nodes: TreeNodeData[] | undefined;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  searchMode: boolean;
}) {
  const { level, parentId, nodes, loading, error, onRetry, searchMode } = props;
  const { canReorder } = useCategoryTree();
  if (loading) return <p className={styles['child-state']}>불러오는 중…</p>;
  if (error)
    return (
      <p className={styles['child-state']} role="alert">
        하위 카테고리를 불러오지 못했습니다.{' '}
        <button type="button" className={styles['link-button']} onClick={onRetry}>
          다시 시도
        </button>
      </p>
    );
  if (!nodes || nodes.length === 0) return <p className={styles['child-state']}>등록된 {LEVEL_LABEL[level]}가 없습니다.</p>;
  const reorderable = !searchMode && canReorder(nodes);
  return (
    <ul className={styles['tree-children']}>
      {nodes.map((child, index) => (
        <CategoryTreeNode
          key={child.id}
          node={child}
          level={level}
          parentId={parentId}
          presetChildren={searchMode ? (child.children ?? []) : undefined}
          reorderable={reorderable}
          index={index}
          siblingCount={nodes.length}
        />
      ))}
    </ul>
  );
}

function depth(level: CategoryLevel): 1 | 2 | 3 {
  return level === 'category' ? 1 : level === 'subCategory' ? 2 : 3;
}
