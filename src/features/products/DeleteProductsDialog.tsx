"use client";

import { useRef, useState } from "react";
import { Dialog } from "primereact/dialog";
import { useDeleteProducts } from "@/hooks/useProducts";
import { useToast } from "@/providers/ToastProvider";
import { errorMessage } from "@/lib/errors";
import btn from "@/components/ui/Button.module.scss";
import styles from "./ProductList.module.scss";

/** Figma 8.1.0 #3: confirm before deleting the selected products. */
export function DeleteProductsDialog({ ids, onClose, onDeleted }: { ids: number[]; onClose: () => void; onDeleted: () => void }) {
  const remove = useDeleteProducts();
  const { notify } = useToast();
  const [apiError, setApiError] = useState<string | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const label = `상품 ${ids.length}개`;

  async function confirm() {
    setApiError(null);
    try {
      await remove.mutateAsync(ids);
      notify("success", `${label}를 삭제했습니다.`);
      onDeleted();
      onClose();
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  return (
    <Dialog
      visible
      header={`${label}를 삭제할까요?`}
      onHide={() => !remove.isPending && onClose()}
      draggable={false}
      resizable={false}
      blockScroll
      pt={{ root: { role: "alertdialog" } }}
      focusOnShow={false}
      onShow={() => cancelRef.current?.focus()}
      footer={
        <>
          <button type="button" ref={cancelRef} className={`${btn.button} ${btn.outline}`} onClick={onClose} disabled={remove.isPending}>
            취소
          </button>
          <button type="button" className={`${btn.button} ${btn.danger}`} onClick={confirm} disabled={remove.isPending} aria-busy={remove.isPending}>
            {remove.isPending ? "삭제 중…" : "삭제"}
          </button>
        </>
      }
    >
      <p className={styles["dialog-body"]}>선택한 {label}가 삭제됩니다. 삭제한 후에는 되돌릴 수 없습니다.</p>
      {apiError && (
        <p className={styles["dialog-error"]} role="alert">
          {apiError}
        </p>
      )}
    </Dialog>
  );
}
