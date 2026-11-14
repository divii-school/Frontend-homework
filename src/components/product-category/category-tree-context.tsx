'use client';

import { createContext, useContext } from 'react';
import type { CategoryLevel } from '@/types/product-category';
import type { CategoryDialogState } from './category-form-dialog';

/** What a tree row needs: id, name, and (in search mode) its children already inside. */
export interface TreeNodeData {
  id: number;
  name: string;
  children?: TreeNodeData[];
}

export interface DeleteRequest {
  level: CategoryLevel;
  node: TreeNodeData;
  /** Known number of children, or undefined if not loaded yet. */
  childCount?: number;
}

export interface DragState {
  level: CategoryLevel;
  parentId: number;
  index: number;
}

/** Shared by every row, so rows stay small: expand state, dialogs, delete, reorder. */
export interface CategoryTreeContextValue {
  isExpanded: (level: CategoryLevel, id: number) => boolean;
  toggle: (level: CategoryLevel, id: number) => void;
  openDialog: (state: CategoryDialogState) => void;
  requestDelete: (request: DeleteRequest) => void;
  canReorder: (siblings: TreeNodeData[]) => boolean;
  move: (level: CategoryLevel, parentId: number, from: number, to: number) => void;
  dragging: DragState | null;
  setDragging: (state: DragState | null) => void;
}

export const CategoryTreeContext = createContext<CategoryTreeContextValue | null>(null);

export function useCategoryTree(): CategoryTreeContextValue {
  const ctx = useContext(CategoryTreeContext);
  if (!ctx) throw new Error('useCategoryTree must be used inside <CategoryTreeContext.Provider>');
  return ctx;
}

/** Key for the expanded-state map, e.g. "subCategory:72". */
export const nodeKey = (level: CategoryLevel, id: number) => `${level}:${id}`;
