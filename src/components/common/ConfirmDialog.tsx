import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import type { ReactNode } from "react";
import { ErrorSummary } from "@/components/common/ErrorSummary";
import type { ApiError } from "@/types/api";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** True while the request runs: the button shows a spinner and cannot be clicked twice. */
  pending: boolean;
  error: ApiError | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/** "Are you sure?" before a delete. Stays open with the API's message when the delete fails. */
export function ConfirmDialog({ visible, title, children, confirmLabel, pending, error, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog
      className="confirm-dialog"
      header={title}
      visible={visible}
      modal
      draggable={false}
      closable={!pending}
      onHide={onCancel}
      footer={
        <>
          <Button type="button" label="취소" outlined disabled={pending} onClick={onCancel} />
          <Button type="button" label={confirmLabel} severity="danger" loading={pending} disabled={pending} onClick={onConfirm} />
        </>
      }
    >
      <ErrorSummary error={error} />
      <div className="confirm-dialog-body">{children}</div>
    </Dialog>
  );
}
