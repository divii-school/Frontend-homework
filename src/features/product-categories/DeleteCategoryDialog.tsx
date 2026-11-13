"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useCategoryMutations } from "@/hooks/useProductCategories";
import { useToast } from "@/providers/ToastProvider";
import { errorMessage } from "@/lib/errors";
import type { CategoryNode } from "@/types/category";
import btn from "@/components/ui/Button.module.scss";
import styles from "./CategoryDialogs.module.scss";

/**
 * Figma 8.2.0 #10: confirm before deleting. A category that still has subcategories
 * can't be deleted (the spec's "Cannot delete due to existing subitems" option).
 */
export function DeleteCategoryDialog({ node, onClose }: { node: CategoryNode; onClose: () => void }) {
  const { remove } = useCategoryMutations();
  const { notify } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  // Start on the safe button (OK / Cancel), never on Delete.
  const safeButton = useRef<HTMLButtonElement>(null);
  const blocked = node.children.length > 0;
  const pending = remove.isPending;

  async function confirm() {
    setApiError(null);
    try {
      await remove.mutateAsync({ id: node.id, level: node.level });
      notify("success", `“${node.name}” was deleted.`);
      onClose();
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  return (
    <Dialog
      visible
      header={blocked ? "Can't delete this category" : "Delete category?"}
      onHide={() => !pending && onClose()}
      draggable={false}
      resizable={false}
      blockScroll
      pt={{ root: { role: "alertdialog" } }}
      focusOnShow={false}
      onShow={() => safeButton.current?.focus()}
      footer={
        blocked ? (
          <button type="button" className={`${btn.button} ${btn.primary}`} onClick={onClose} ref={safeButton}>
            OK
          </button>
        ) : (
          <>
            <button type="button" className={`${btn.button} ${btn.outline}`} onClick={onClose} disabled={pending} ref={safeButton}>
              Cancel
            </button>
            <button type="button" className={`${btn.button} ${btn.danger}`} onClick={confirm} disabled={pending} aria-busy={pending}>
              {pending ? "Deleting…" : "Delete"}
            </button>
          </>
        )
      }
    >
      <p className={styles.target}>
        <span className={styles.code}>[{node.id}]</span> {node.name}
      </p>
      {blocked ? (
        <p className={styles.body}>
          It still has {node.children.length} {node.children.length === 1 ? "subcategory" : "subcategories"}. Delete those first.
        </p>
      ) : (
        <p className={styles.body}>This can&apos;t be undone.</p>
      )}
      {apiError && (
        <p className={styles.error} role="alert">
          {apiError}
        </p>
      )}
    </Dialog>
  );
}
