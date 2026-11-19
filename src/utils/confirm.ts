import { confirmDialog } from "primereact/confirmdialog";

// Promise wrapper around the one global <ConfirmDialog /> (mounted by ToastProvider).
//   if (await confirmDelete(`Delete ${count} products?`)) deleteProducts.mutate(ids);

export interface ConfirmOptions {
  message: string;
  header?: string;
  acceptLabel?: string;
  rejectLabel?: string;
  /** Red accept button (delete). */
  danger?: boolean;
  icon?: string;
}

/** Opens the confirm dialog; resolves true on accept, false on cancel / Escape / close. */
export function confirmAction({
  message,
  header = "확인",
  acceptLabel = "확인",
  rejectLabel = "취소",
  danger = false,
  icon = "pi pi-exclamation-triangle",
}: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    confirmDialog({
      message,
      header,
      icon,
      acceptLabel,
      rejectLabel,
      acceptClassName: danger ? "p-button-danger" : undefined,
      rejectClassName: "p-button-outlined",
      accept: () => settle(true),
      reject: () => settle(false),
      onHide: () => settle(false),
    });
  });
}

/** Delete confirmation with a red "Delete" button. */
export function confirmDelete(message: string, header = "삭제"): Promise<boolean> {
  return confirmAction({ message, header, acceptLabel: "삭제", danger: true, icon: "pi pi-trash" });
}
