'use client';

import { Button } from 'primereact/button';
import type { CategoryNode } from '../types';
import styles from './CategoryTree.module.scss';

interface Props {
  nodes: CategoryNode[];
  expanded: Set<string>;
  canWrite: boolean;
  onToggle: (key: string) => void;
  onAddChild: (node: CategoryNode) => void;
  onEdit: (node: CategoryNode, siblings: CategoryNode[]) => void;
  onDelete: (node: CategoryNode) => void;
}

export const nodeKey = (n: CategoryNode) => `${n.level}-${n.id}`;

export function CategoryTree(props: Props) {
  return (
    <ul className={styles.tree} role="tree" aria-label="상품 카테고리">
      {props.nodes.map((n) => (
        <TreeItem key={nodeKey(n)} node={n} siblings={props.nodes} {...props} />
      ))}
    </ul>
  );
}

function TreeItem({ node, siblings, ...p }: Props & { node: CategoryNode; siblings: CategoryNode[] }) {
  const key = nodeKey(node);
  const hasChildren = node.children.length > 0;
  const isOpen = p.expanded.has(key);
  const childLabel = node.level === 1 ? '중분류' : '소분류';

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? isOpen : undefined}
      aria-level={node.level}
      aria-selected={false}
      className={styles.item}
    >
      <div className={`${styles.row} ${styles[`level${node.level}`]}`}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={() => p.onToggle(key)}
            aria-label={`${node.name} ${isOpen ? '접기' : '펼치기'}`}
          >
            <i className={isOpen ? 'pi pi-chevron-down' : 'pi pi-chevron-right'} aria-hidden="true" />
          </button>
        ) : (
          <span className={styles.toggleSpacer} />
        )}
        <span className={styles.name}>
          <span className={styles.code}>[{node.id}]</span> {node.name}
          {hasChildren && <span className={styles.count}>({node.children.length}개 하위 분류)</span>}
        </span>
        {p.canWrite && (
          <span className={styles.actions}>
            {node.level < 3 && (
              <Button
                size="small"
                className="btn-accent"
                icon="pi pi-plus"
                label={childLabel}
                aria-label={`${node.name}에 ${childLabel} 추가`}
                onClick={() => p.onAddChild(node)}
              />
            )}
            <Button
              icon="pi pi-pencil"
              text
              rounded
              aria-label={`${node.name} 수정`}
              onClick={() => p.onEdit(node, siblings)}
            />
            <Button icon="pi pi-trash" text rounded aria-label={`${node.name} 삭제`} onClick={() => p.onDelete(node)} />
          </span>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul role="group" className={styles.tree}>
          {node.children.map((c) => (
            <TreeItem key={nodeKey(c)} node={c} siblings={node.children} {...p} />
          ))}
        </ul>
      )}
    </li>
  );
}
