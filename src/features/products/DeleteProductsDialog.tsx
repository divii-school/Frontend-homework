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
  const label = `${ids.length} ${ids.length === 1 ? "product" : "products"}`;

  async function confirm() {
    setApiError(null);
    try {
      await remove.mutateAsync(ids);
      notify("success", `Deleted ${label}.`);
      onDeleted();
      onClose();
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  return (
    <Dialog
      visible
      header={`Delete ${label}?`}
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
            Cancel
          </button>
          <button type="button" className={`${btn.button} ${btn.danger}`} onClick={confirm} disabled={remove.isPending} aria-busy={remove.isPending}>
            {remove.isPending ? "Deleting…" : "Delete"}
          </button>
        </>
      }
    >
      <p className={styles.dialogBody}>The selected {label} will be deleted. This can&apos;t be undone.</p>
      {apiError && (
        <p className={styles.dialogError} role="alert">
          {apiError}
        </p>
      )}
    </Dialog>
  );
}
