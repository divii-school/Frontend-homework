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
      notify("success", `“${node.name}” 카테고리를 삭제했습니다.`);
      onClose();
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  return (
    <Dialog
      visible
      header={blocked ? "삭제할 수 없는 카테고리" : "카테고리를 삭제할까요?"}
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
            확인
          </button>
        ) : (
          <>
            <button type="button" className={`${btn.button} ${btn.outline}`} onClick={onClose} disabled={pending} ref={safeButton}>
              취소
            </button>
            <button type="button" className={`${btn.button} ${btn.danger}`} onClick={confirm} disabled={pending} aria-busy={pending}>
              {pending ? "삭제 중…" : "삭제"}
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
          하위 카테고리가 {node.children.length}개 있습니다. 하위 카테고리를 먼저 삭제해 주세요.
        </p>
      ) : (
        <p className={styles.body}>삭제한 후에는 되돌릴 수 없습니다.</p>
      )}
      {apiError && (
        <p className={styles.error} role="alert">
          {apiError}
        </p>
      )}
    </Dialog>
  );
}
