"use client";

import { Button } from "primereact/button";
import { LEVEL_LABEL } from "@/components/categories/CategoryDialog";
import type { Category, CategoryLevel, CategoryTarget } from "@/types/category";
import { formatCount } from "@/utils/format";

interface CategoryTreeProps {
  categories: Category[];
  /** Ids of the open rows, as "category-67" / "sub-72". */
  expanded: Set<string>;
  canWrite: boolean;
  canDelete: boolean;
  onToggle: (key: string) => void;
  onEdit: (target: CategoryTarget) => void;
  onDelete: (target: CategoryTarget) => void;
}

interface RowProps extends Omit<CategoryTreeProps, "categories"> {
  level: CategoryLevel;
  node: { id: number; name: string };
  parentId?: number;
  /** Number of nodes one level down; undefined on the last level, which cannot be opened. */
  childCount?: number;
}

const CHILD_LEVEL: Record<CategoryLevel, CategoryLevel | null> = { category: "sub", sub: "child", child: null };

/** One line of the tree: open/close, id and name, and the buttons this user may use. */
function CategoryRow({ level, node, parentId, childCount, expanded, canWrite, canDelete, onToggle, onEdit, onDelete }: RowProps) {
  const key = `${level}-${node.id}`;
  const open = expanded.has(key);
  const childLevel = CHILD_LEVEL[level];
  return (
    <div className={`category-row category-row-${level}`}>
      {childLevel ? (
        <Button
          type="button"
          text
          icon={open ? "pi pi-chevron-down" : "pi pi-chevron-right"}
          aria-expanded={open}
          aria-label={`${node.name} ${open ? "접기" : "펼치기"}`}
          onClick={() => onToggle(key)}
        />
      ) : (
        <span className="category-row-spacer" aria-hidden="true" />
      )}
      <span className="category-row-id">[{node.id}]</span>
      <span className="category-row-name">{node.name}</span>
      {childLevel && childCount !== undefined && (
        <span className="category-row-count">
          ({formatCount(childCount)}개 {LEVEL_LABEL[childLevel]})
        </span>
      )}
      <span className="category-row-actions">
        {canWrite && childLevel && (
          <Button
            type="button"
            size="small"
            label={`+ ${LEVEL_LABEL[childLevel]}`}
            aria-label={`${node.name}에 ${LEVEL_LABEL[childLevel]} 추가`}
            onClick={() => onEdit({ level: childLevel, parentId: node.id })}
          />
        )}
        {canWrite && (
          <Button
            type="button"
            text
            icon="pi pi-pencil"
            aria-label={`${node.name} 수정`}
            onClick={() => onEdit({ level, id: node.id, parentId, name: node.name })}
          />
        )}
        {canDelete && (
          <Button
            type="button"
            text
            severity="danger"
            icon="pi pi-trash"
            aria-label={`${node.name} 삭제`}
            onClick={() => onDelete({ level, id: node.id, name: node.name })}
          />
        )}
      </span>
    </div>
  );
}

/** The three-level category tree as nested lists. Which rows are open is decided by the parent. */
export function CategoryTree({ categories, ...rest }: CategoryTreeProps) {
  return (
    <ul className="category-tree" aria-label="상품 카테고리">
      {categories.map((category) => (
        <li key={category.id}>
          <CategoryRow {...rest} level="category" node={category} childCount={category.subCategories.length} />
          {rest.expanded.has(`category-${category.id}`) && (
            <ul>
              {category.subCategories.length === 0 && <li className="category-tree-empty">등록된 중분류가 없습니다.</li>}
              {category.subCategories.map((sub) => (
                <li key={sub.id}>
                  <CategoryRow {...rest} level="sub" node={sub} parentId={category.id} childCount={sub.childCategories.length} />
                  {rest.expanded.has(`sub-${sub.id}`) && (
                    <ul>
                      {sub.childCategories.length === 0 && <li className="category-tree-empty">등록된 소분류가 없습니다.</li>}
                      {sub.childCategories.map((child) => (
                        <li key={child.id}>
                          <CategoryRow {...rest} level="child" node={child} parentId={sub.id} />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}
